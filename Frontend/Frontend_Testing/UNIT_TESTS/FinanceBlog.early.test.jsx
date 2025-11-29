import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogService } from "../../api/index";
import FinanceBlog from "../blogPage";
import { formatDate } from "../blogPage";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";


jest.mock("../../components/Header", () => () => <div>Header</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);


jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));


jest.mock("../../api/index", () => ({
  blogService: {
    getBlogPosts: jest.fn(),
    getBlogPost: jest.fn(),
    createBlogPost: jest.fn(),
    toggleLike: jest.fn(),
    toggleBookmark: jest.fn(),
    testAuth: jest.fn(),
  },
}));

describe("FinanceBlog() FinanceBlog method", () => {
  let setStateMock;
  let useRefMock;
  let useEffectMock;
  let navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    blogService.getBlogPosts.mockResolvedValue({ success: true, posts: [] });
  });
 
  //test
  describe("Additional Coverage", () => {
    //1.
    test("1.uploads image file and cancels upload", () => {
      blogService.getBlogPosts.mockResolvedValue({ success: true, posts: [] });

      render(<FinanceBlog />);
      fireEvent.click(screen.getByText("Create"));

      const file = new File(["img"], "test.png", { type: "image/png" });
      const input = screen.getByTestId("file-input", { selector: "input" });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText("test.png")).toBeInTheDocument();
      expect(screen.getByTitle("Remove image")).toBeInTheDocument();

      fireEvent.click(screen.getByTitle("Remove image"));
      expect(screen.queryByText("test.png")).not.toBeInTheDocument();
    });

    //2.
    test("2.submits blog when authenticated (form passes validation)", async () => {
      blogService.testAuth.mockResolvedValue({
        authenticated: true,
        user: "Dev",
      });
      blogService.createBlogPost.mockResolvedValue({ success: true });
      blogService.getBlogPosts.mockResolvedValue({ success: true, posts: [] });

      render(<FinanceBlog />);
      fireEvent.click(screen.getByText("Create"));

      fireEvent.change(screen.getByPlaceholderText(/Enter blog title/i), {
        target: { value: "Valid Title" },
      });

      fireEvent.change(
        screen.getByPlaceholderText(/Brief description of your blog/i),
        { target: { value: "a".repeat(60) } }
      );

      fireEvent.change(
        screen.getByPlaceholderText(/Write your blog content/i),
        {
          target: { value: "b".repeat(250) },
        }
      );

      fireEvent.click(screen.getByTestId("publish-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("validation-error")).toBeNull();
      });
    });

    //3.
    test("3.toggles like and bookmark on an article", async () => {
      const post = {
        id: 11,
        title: "Likeable Post",
        snippet: "Snippet",
        likes: 5,
        is_liked: false,
        is_bookmarked: false,
      };

      blogService.getBlogPosts.mockResolvedValue({
        success: true,
        posts: [post],
      });
      blogService.getBlogPost.mockResolvedValue({ data: post });
      blogService.toggleLike.mockResolvedValue({ likes_count: 6, liked: true });
      blogService.toggleBookmark.mockResolvedValue({ bookmarked: true });

      render(<FinanceBlog />);

      await waitFor(() => expect(blogService.getBlogPosts).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getByText("Likeable Post")).toBeInTheDocument()
      );

      fireEvent.click(screen.getByText("Likeable Post"));
      await waitFor(() =>
        expect(blogService.getBlogPost).toHaveBeenCalledWith(11)
      );

      const likeBtn = screen.getByRole("button", { name: /Like/i });
      fireEvent.click(likeBtn);
      await waitFor(() =>
        expect(blogService.toggleLike).toHaveBeenCalledWith(11)
      );

      const bmBtn = screen.getByRole("button", { name: /Bookmark/i });
      fireEvent.click(bmBtn);
      await waitFor(() =>
        expect(blogService.toggleBookmark).toHaveBeenCalledWith(11)
      );

      
      await waitFor(() =>
        expect(screen.getByText(/Likeable Post/)).toBeInTheDocument()
      );
      await waitFor(() => expect(screen.getByText("6")).toBeInTheDocument());
    });

    //4.
    test("4.shows error when fetching full article fails", async () => {
      const post = { id: 22, title: "Broken Post", snippet: "x" };
      blogService.getBlogPosts.mockResolvedValue({
        success: true,
        posts: [post],
      });
      blogService.getBlogPost.mockRejectedValue(new Error("Network"));

      render(<FinanceBlog />);
      await waitFor(() =>
        expect(screen.getByText("Broken Post")).toBeInTheDocument()
      );

      fireEvent.click(screen.getByText("Broken Post"));

      await waitFor(() =>
        expect(screen.getByTestId("error-message")).toBeInTheDocument()
      );
    });
  });

  describe("Happy Paths", () => {
    //5.
    test("5.should render the FinanceBlog component with header and footer", () => {
      render(<FinanceBlog />);
      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    //6.
    test("6.should fetch and display blog posts on initial render", async () => {
      const mockPosts = [
        {
          id: 1,
          title: "Test Blog 1",
          snippet: "Snippet 1",
          category: "Investments",
        },
        {
          id: 2,
          title: "Test Blog 2",
          snippet: "Snippet 2",
          category: "Personal Finance",
        },
      ];
      blogService.getBlogPosts.mockResolvedValue({
        success: true,
        posts: mockPosts,
      });

      render(<FinanceBlog />);

      await waitFor(() => {
        expect(blogService.getBlogPosts).toHaveBeenCalled();
        expect(screen.getByText("Test Blog 1")).toBeInTheDocument();
        expect(screen.getByText("Test Blog 2")).toBeInTheDocument();
      });
    });

    //7.
    test("7.should navigate to article view on article click", async () => {
      const mockPost = {
        id: 1,
        title: "Test Blog 1",
        snippet: "Snippet 1",
        category: "Investments",
      };
      blogService.getBlogPosts.mockResolvedValue({
        success: true,
        posts: [mockPost],
      });
      blogService.getBlogPost.mockResolvedValue({ data: mockPost });

      render(<FinanceBlog />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Test Blog 1"));
      });

      expect(blogService.getBlogPost).toHaveBeenCalledWith(1);
      expect(screen.getByText("Back to Blogs")).toBeInTheDocument();
    });
  
    //8.
    test("8.formatDate returns readable date for valid date string", () => {
      const d = formatDate("2023-11-01T12:00:00Z");
      expect(typeof d).toBe("string");
      expect(d).toMatch(/2023/);
    });
   
    //9.
    test("9.handles plain-array response from getBlogPosts", async () => {
      const arr = [
        { id: 101, title: "Array Post", snippet: "x", category: "Investments" },
      ];
      
      blogService.getBlogPosts.mockResolvedValue(arr);

      render(<FinanceBlog />);

      await waitFor(() => {
        expect(screen.getByText("Array Post")).toBeInTheDocument();
      });
    });

    //10.
    test("10.search input shows search info and triggers fetch", async () => {
      const posts = [
        { id: 300, title: "Searchable", snippet: "s", category: "Investments" },
      ];
      blogService.getBlogPosts.mockResolvedValue({ success: true, posts });

      render(<FinanceBlog />);

      const input = screen.getByPlaceholderText("Search blogs...");
      fireEvent.change(input, { target: { value: "Searchable" } });

      await waitFor(() =>
        expect(
          screen.getByText(/Showing results for "Searchable"/i)
        ).toBeInTheDocument()
      );
    });

    //11.
    test("11.selecting category calls fetch again", async () => {
      blogService.getBlogPosts.mockResolvedValue({ success: true, posts: [] });
      render(<FinanceBlog />);

      
      await waitFor(() => expect(blogService.getBlogPosts).toHaveBeenCalled());
      const initialCalls = blogService.getBlogPosts.mock.calls.length;

      
      fireEvent.click(screen.getByText("Categories"));
      fireEvent.click(screen.getByText("Investments"));

      await waitFor(() =>
        expect(blogService.getBlogPosts.mock.calls.length).toBeGreaterThan(
          initialCalls
        )
      );
    });
    
    //12.
    test("12.back to listing button returns from article view", async () => {
      const mockPost = {
        id: 77,
        title: "Backable",
        snippet: "s",
        category: "Investments",
      };
      blogService.getBlogPosts.mockResolvedValue({
        success: true,
        posts: [mockPost],
      });
      blogService.getBlogPost.mockResolvedValue({ data: mockPost });

      render(<FinanceBlog />);

      await waitFor(() =>
        expect(screen.getByText("Backable")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Backable"));

      await waitFor(() =>
        expect(blogService.getBlogPost).toHaveBeenCalledWith(77)
      );
      fireEvent.click(screen.getByText(/Back to Blogs/i));
      expect(screen.getByText(/Most Popular/i)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    //13
    test("13.should display error message when fetching blog posts fails", async () => {
      blogService.getBlogPosts.mockRejectedValue(new Error("Failed to fetch"));

      render(<FinanceBlog />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to fetch blog posts")
        ).toBeInTheDocument();
      });
    });
    //14
    test("14.should handle empty blog post list gracefully", async () => {
      blogService.getBlogPosts.mockResolvedValue({ success: true, posts: [] });

      render(<FinanceBlog />);

      await waitFor(() => {
        const nodes = screen.getAllByText("No blogs found");
        expect(nodes.length).toBeGreaterThanOrEqual(2);
      });
    });
    
    //15
    test("15.renders default image when post has no image", async () => {
      const post = { id: 200, title: "NoImage", snippet: "s", category: "" };
      blogService.getBlogPosts.mockResolvedValue({
        success: true,
        posts: [post],
      });

      render(<FinanceBlog />);

      await waitFor(() =>
        expect(screen.getByText("NoImage")).toBeInTheDocument()
      );

      const imgs = document.getElementsByTagName("img");
      let found = false;
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.alt === "NoImage") {
          found = true;
          expect(img.src).toMatch(/images.unsplash|pinimg|i.pinimg/);
        }
      }
      expect(found).toBe(true);
    });
    
    //16
    test("16.should display validation error when creating a blog with missing fields", async () => {
      render(<FinanceBlog />);

      fireEvent.click(screen.getByText("Create"));
      fireEvent.click(screen.getByTestId("publish-button"));

      await waitFor(() => {
        expect(blogService.testAuth).not.toHaveBeenCalled();
        expect(blogService.createBlogPost).not.toHaveBeenCalled();
      });
    });
  });
});
