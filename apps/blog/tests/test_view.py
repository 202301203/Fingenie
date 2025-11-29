import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from blog.models import BlogPost, BlogLike, BlogBookmark
from accounts.models import UserActivity
from blog.serializers import BlogPostCreateSerializer

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        username="testuser",
        password="testpassword123"
    )

@pytest.fixture
def second_user(django_user_model):
    return django_user_model.objects.create_user(
        username="otheruser",
        password="testpassword123"
    )

@pytest.fixture
def blog_post(user):
    return BlogPost.objects.create(
        author=user,
        title="Test Blog Post",
        content="Content",
        snippet="Snippet",
        category="Investments",
        published=True
    )

@pytest.mark.django_db
class TestBlogPostViewSet:

    def test_list_posts_public(self, api_client, blog_post):
        url = reverse("blogpost-list")
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_list_filters_category(self, api_client, user):
        BlogPost.objects.create(
            author=user, title="A", content="C", snippet="S",
            category="Investments", published=True
        )
        BlogPost.objects.create(
            author=user, title="B", content="C", snippet="S",
            category="Personal Finance", published=True
        )

        url = reverse("blogpost-list")

        assert len(api_client.get(url, {"category": "Investments"}).data) == 1
        assert len(api_client.get(url, {"category": "all"}).data) == 2

    def test_list_combined_search_category(self, api_client, user):
        BlogPost.objects.create(
            author=user, title="Python Money", content="X", snippet="Y",
            category="Investments", published=True
        )
        BlogPost.objects.create(
            author=user, title="Cooking Tips", content="X", snippet="Y",
            category="Investments", published=True
        )

        url = reverse("blogpost-list")
        r = api_client.get(url, {"search": "Python", "category": "Investments"})
        assert len(r.data) == 1

    def test_create_post_unauthorized(self, api_client):
        url = reverse("blogpost-list")
        r = api_client.post(url, {"title": "x", "content": "y"})
        assert r.status_code == 403

    def test_create_post_authorized(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse("blogpost-list")

        r = api_client.post(url, {
            "title": "Article",
            "content": "Deep dive",
            "snippet": "Finance",
            "category": "Investments"
        })

        assert r.status_code == 201
        assert BlogPost.objects.count() == 1

    def test_create_post_validation_error(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse("blogpost-list")
        assert api_client.post(url, {}).status_code == 400

    def test_get_serializer_class_list(self, api_client):
        url = reverse("blogpost-list")
        assert api_client.get(url).status_code == 200

    def test_get_serializer_class_detail(self, api_client, blog_post):
        url = reverse("blogpost-detail", args=[blog_post.id])
        assert api_client.get(url).status_code == 200

    def test_toggle_like_unauthenticated(self, api_client, blog_post):
        url = reverse("blogpost-toggle-like", args=[blog_post.id])
        assert api_client.post(url).status_code == 403

    def test_toggle_like(self, api_client, user, blog_post):
        api_client.force_authenticate(user=user)
        url = reverse("blogpost-toggle-like", args=[blog_post.id])

        assert api_client.post(url).data["liked"] is True
        assert api_client.post(url).data["liked"] is False

    def test_toggle_bookmark_unauthenticated(self, api_client, blog_post):
        url = reverse("blogpost-toggle-bookmark", args=[blog_post.id])
        assert api_client.post(url).status_code == 403

    def test_toggle_bookmark(self, api_client, user, blog_post):
        api_client.force_authenticate(user=user)
        url = reverse("blogpost-toggle-bookmark", args=[blog_post.id])

        assert api_client.post(url).data["bookmarked"] is True
        assert api_client.post(url).data["bookmarked"] is False

    def test_my_posts_requires_auth(self, api_client):
        assert api_client.get(reverse("blogpost-my-posts")).status_code == 401

    def test_my_posts_action(self, api_client, user, second_user):
        BlogPost.objects.create(author=user, title="Mine", content="c", snippet="s", published=True)
        BlogPost.objects.create(author=second_user, title="Other", content="c", snippet="s", published=True)

        api_client.force_authenticate(user=user)
        r = api_client.get(reverse("blogpost-my-posts"))
        assert len(r.data) == 1

    def test_my_bookmarks_requires_auth(self, api_client):
        assert api_client.get(reverse("blogpost-my-bookmarks")).status_code == 401

    def test_my_bookmarks(self, api_client, user, second_user):
        post = BlogPost.objects.create(
            author=second_user, title="Other", content="c",
            snippet="s", published=True
        )
        BlogBookmark.objects.create(user=user, post=post)

        api_client.force_authenticate(user=user)
        r = api_client.get(reverse("blogpost-my-bookmarks"))
        assert len(r.data) == 1

    def test_serializer_anonymous_fields(self, api_client, blog_post):
        r = api_client.get(reverse("blogpost-detail", args=[blog_post.id]))
        assert r.data["is_liked"] is False
        assert r.data["is_bookmarked"] is False

    def test_serializer_method_fields_authenticated(self, api_client, user, blog_post):
        BlogLike.objects.create(user=user, post=blog_post)
        BlogBookmark.objects.create(user=user, post=blog_post)

        api_client.force_authenticate(user=user)
        r = api_client.get(reverse("blogpost-detail", args=[blog_post.id]))
        assert r.data["is_liked"] is True
        assert r.data["is_bookmarked"] is True

    def test_model_str_and_author_name(self, blog_post):
        assert str(blog_post) == "Test Blog Post"
        assert blog_post.get_author_name() == "testuser"

    def test_increment_views(self, api_client, blog_post):
        url = reverse("blogpost-increment-views", args=[blog_post.id])
        api_client.get(url)
        api_client.get(url)
        blog_post.refresh_from_db()
        assert blog_post.views == 2

    def test_publish_draft_post(self, api_client, user):
        api_client.force_authenticate(user=user)

        draft = BlogPost.objects.create(
            author=user, title="Draft",
            content="c", snippet="s",
            published=False
        )

        url = reverse("blogpost-detail", args=[draft.id])
        r = api_client.put(url, {
            "title": "Draft",
            "content": "c",
            "snippet": "s",
            "category": "Investments",
            "published": True
        })

        assert r.status_code == 200
        assert UserActivity.objects.filter(title="Published: Draft").exists()

@pytest.mark.django_db
def test_perform_create_calls_author_and_published(api_client, user):
    from blog.views import BlogPostViewSet

    api_client.force_authenticate(user=user)
    viewset = BlogPostViewSet()
    viewset.request = type("Req", (), {"user": user})()

    serializer = BlogPostCreateSerializer(data={
        "title": "Perform Create Test",
        "content": "Content",
        "snippet": "Snippet",
        "category": "Investments",
        "published": False
    })
    serializer.is_valid(raise_exception=True)

    viewset.perform_create(serializer)
    post = BlogPost.objects.last()

    assert post.author == user
    assert post.published is False

@pytest.mark.django_db
def test_create_direct_call_hits_custom_403():
    """Covers the branch: if not request.user → return custom 403 message."""
    from blog.views import BlogPostViewSet

    request = type("Req", (), {"user": None, "data": {}})()
    viewset = BlogPostViewSet()
    viewset.request = request

    response = viewset.create(request)
    assert response.status_code == 403
    assert "You need to be logged in" in response.data["detail"]

@pytest.mark.django_db
def test_toggle_like_direct_unauthenticated(blog_post):
    from blog.views import BlogPostViewSet

    request = type("Req", (), {"user": None})()
    viewset = BlogPostViewSet()
    viewset.request = request

    response = viewset.toggle_like(request, pk=blog_post.id)
    assert response.status_code == 401
    assert response.data["detail"] == "Authentication required"

@pytest.mark.django_db
def test_toggle_bookmark_direct_unauthenticated(blog_post):
    from blog.views import BlogPostViewSet

    request = type("Req", (), {"user": None})()
    viewset = BlogPostViewSet()
    viewset.request = request

    response = viewset.toggle_bookmark(request, pk=blog_post.id)
    assert response.status_code == 401
    assert response.data["detail"] == "Authentication required"



# added test cases after first iteration of mutation testing

@pytest.mark.django_db
def test_guest_sees_only_published(api_client, user):
    BlogPost.objects.create(author=user, title="Pub", content="c", snippet="s", published=True)
    BlogPost.objects.create(author=user, title="Draft", content="c", snippet="s", published=False)

    r = api_client.get(reverse("blogpost-list"))
    assert len(r.data) == 1
    assert r.data[0]["title"] == "Pub"


@pytest.mark.django_db
def test_authenticated_sees_own_drafts(api_client, user):
    api_client.force_authenticate(user=user)

    BlogPost.objects.create(author=user, title="My Draft", content="c", snippet="s", published=False)
    BlogPost.objects.create(author=user, title="My Pub", content="c", snippet="s", published=True)

    r = api_client.get(reverse("blogpost-list"))
    titles = [p["title"] for p in r.data]

    assert "My Draft" in titles
    assert "My Pub" in titles

@pytest.mark.django_db
def test_search_filters_title_only(api_client, user):
    BlogPost.objects.create(author=user, title="Python Tips", content="aaa", snippet="bbb", published=True)
    BlogPost.objects.create(author=user, title="Cooking", content="python", snippet="zzz", published=True)

    r = api_client.get(reverse("blogpost-list"), {"search": "Python"})
    assert len(r.data) == 2  


@pytest.mark.django_db
def test_search_no_results(api_client):
    r = api_client.get(reverse("blogpost-list"), {"search": "XXXXXXXX"})
    assert r.status_code == 200
    assert len(r.data) == 0

@pytest.mark.django_db
def test_category_filter_exact(api_client, user):
    BlogPost.objects.create(author=user, title="A", content="c", snippet="s", category="Investments", published=True)
    BlogPost.objects.create(author=user, title="B", content="c", snippet="s", category="Personal", published=True)

    r = api_client.get(reverse("blogpost-list"), {"category": "Investments"})
    assert len(r.data) == 1
    assert r.data[0]["category"] == "Investments"


@pytest.mark.django_db
def test_category_all_does_not_filter(api_client, user):
    BlogPost.objects.create(author=user, title="A", content="c", snippet="s", category="Investments", published=True)
    BlogPost.objects.create(author=user, title="B", content="c", snippet="s", category="Personal", published=True)

    r = api_client.get(reverse("blogpost-list"), {"category": "all"})
    assert len(r.data) == 2

@pytest.mark.django_db
def test_get_serializer_class_update_branch(api_client, user, blog_post):
    api_client.force_authenticate(user=user)

    url = reverse("blogpost-detail", args=[blog_post.id])
    r = api_client.put(url, {
        "title": blog_post.title,
        "content": blog_post.content,
        "snippet": blog_post.snippet,
        "category": blog_post.category,
        "published": True
    })

    assert r.status_code == 200

@pytest.mark.django_db
def test_create_always_forces_published_true(api_client, user):
    api_client.force_authenticate(user=user)

    r = api_client.post(reverse("blogpost-list"), {
        "title": "Force Pub",
        "content": "c",
        "snippet": "s",
        "category": "Investments",
        "published": False
    })

    assert r.status_code == 201
    post = BlogPost.objects.get(title="Force Pub")
    assert post.published is True

@pytest.mark.django_db
def test_update_draft_to_draft_does_not_create_activity(api_client, user):
    api_client.force_authenticate(user=user)

    post = BlogPost.objects.create(
        author=user, title="Still Draft",
        content="c", snippet="s",
        category="Investments",
        published=False
    )

    url = reverse("blogpost-detail", args=[post.id])
    api_client.put(url, {
        "title": "Still Draft",
        "content": "c",
        "snippet": "s",
        "category": "Investments",
        "published": False
    })

    assert not UserActivity.objects.filter(title="Published: Still Draft").exists()

@pytest.mark.django_db
def test_toggle_like_increments_and_decrements_likes(api_client, user, blog_post):
    api_client.force_authenticate(user=user)

    url = reverse("blogpost-toggle-like", args=[blog_post.id])

    r1 = api_client.post(url)
    blog_post.refresh_from_db()
    assert r1.data["liked"] is True
    assert blog_post.likes == 1

    r2 = api_client.post(url)
    blog_post.refresh_from_db()
    assert r2.data["liked"] is False
    assert blog_post.likes == 0


@pytest.mark.django_db
def test_toggle_bookmark_idempotency(api_client, user, blog_post):
    api_client.force_authenticate(user=user)

    url = reverse("blogpost-toggle-bookmark", args=[blog_post.id])

    r1 = api_client.post(url)
    r2 = api_client.post(url)

    assert r1.data["bookmarked"] is True
    assert r2.data["bookmarked"] is False
    assert BlogBookmark.objects.filter(user=user, post=blog_post).count() == 0


@pytest.mark.django_db
def test_my_posts_empty_list(api_client, user):
    api_client.force_authenticate(user=user)
    r = api_client.get(reverse("blogpost-my-posts"))
    assert r.status_code == 200
    assert r.data == []


@pytest.mark.django_db
def test_my_bookmarks_empty_list(api_client, user):
    api_client.force_authenticate(user=user)
    r = api_client.get(reverse("blogpost-my-bookmarks"))
    assert r.status_code == 200
    assert r.data == []

@pytest.mark.django_db
def test_increment_views_three_times(api_client, blog_post):
    url = reverse("blogpost-increment-views", args=[blog_post.id])

    api_client.get(url)
    api_client.get(url)
    api_client.get(url)

    blog_post.refresh_from_db()
    assert blog_post.views == 3