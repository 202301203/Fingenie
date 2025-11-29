import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import NewsPage from "../news_page";


jest.mock("../../api/index", () => ({
  DJANGO_API_BASE: "http://mockapi.com",
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => global.__mockNavigate || (() => {}),
    useLocation: () =>
      typeof global.__mockUseLocation === "function"
        ? global.__mockUseLocation()
        : { search: "?page=1" },
  };
});

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock("../../components/Header", () => () => <div data-testid="header" />);
jest.mock("../../components/Footer", () => () => <div data-testid="footer" />);


const mockArticles = [
  {
    title: "Tech Stocks Soar",
    author: "Jane Doe",
    source: { name: "Financial Times" },
    publishedAt: "2025-01-01T10:00:00Z",
    url: "url1",
    urlToImage: "img1",
  },
  {
    title: "Oil Prices Drop",
    author: "John Smith",
    source: { name: "CNBC" },
    publishedAt: "2025-01-02T10:00:00Z",
    url: "url2",
    urlToImage: "img2",
  },
  {
    title: "New FinTech Startup",
    author: "Jane Doe",
    source: { name: "TechCrunch" },
    publishedAt: "2025-01-03T10:00:00Z",
    url: "url3",
    urlToImage: "img3",
  },
];

const mockPage1Response = {
  articles: mockArticles.slice(0, 2),
  page: 1,
  total_pages: 3,
  next_page: 2,
  prev_page: null,
};

const mockPage2Response = {
  articles: mockArticles.slice(2, 3),
  page: 2,
  total_pages: 3,
  next_page: 3,
  prev_page: 1,
};


let fetchSpy;
beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocation.mockReturnValue({ search: "?page=1" });
  global.__mockNavigate = mockNavigate;
  global.__mockUseLocation = () => mockUseLocation();

  fetchSpy = jest.fn();
  global.fetch = fetchSpy;
});

afterEach(() => {
  jest.resetAllMocks();
  try {
    delete global.fetch;
  } catch (e) {
    global.fetch = undefined;
  }
});

const renderNewsPage = () => {
  return render(
    <BrowserRouter>
      <NewsPage />
    </BrowserRouter>
  );
};

const mockSuccessfulFetch = () => {
  fetchSpy.mockImplementation((url) => {
    if (url.includes("page=1")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPage1Response),
      });
    }
    if (url.includes("page=2")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPage2Response),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ articles: [], page: 1, total_pages: 1 }),
    });
  });
};

// tests
describe("Data Fetching and Render", () => {
  
  //1.
  it("1. Renders loading state initially and fetches articles for page 1", async () => {
    mockSuccessfulFetch();
    renderNewsPage();

    expect(screen.getByText(/Loading news.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "http://mockapi.com/api/articles/?page=1"
      );
    });
  });

  // 2.
  it("2. Renders fetched articles and pagination controls successfully", async () => {
    mockSuccessfulFetch();
    renderNewsPage();

    
    await waitFor(() => {
      expect(screen.queryByText(/Loading news.../i)).not.toBeInTheDocument();
      expect(screen.getByText("Tech Stocks Soar")).toBeInTheDocument();
      expect(screen.getByText("Oil Prices Drop")).toBeInTheDocument();

      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();

      expect(screen.getByRole("button", { name: /Next/i })).not.toBeDisabled();
    });
  });

  //3.
  it("3. Displays error message if API fetch fails", async () => {
    const errorMessage = "Authentication failed";
    fetchSpy.mockRejectedValueOnce(new Error(errorMessage));

    renderNewsPage();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(screen.queryByText("Tech Stocks Soar")).not.toBeInTheDocument();
  });
});

describe("Page", () => {
  // 4.
  it('4. Navigates to the next page when "Next" is clicked', async () => {
    mockSuccessfulFetch();
    renderNewsPage();

    await waitFor(() =>
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument()
    );

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "http://mockapi.com/api/articles/?page=2"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/NewsPage?page=2", {
        replace: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("New FinTech Startup")).toBeInTheDocument();
      expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    });
  });
 
  //5.
  it('5. Navigates back to the previous page when "Previous" is clicked', async () => {
    mockSuccessfulFetch();

    mockUseLocation.mockReturnValue({ search: "?page=2" });
    renderNewsPage();

    await waitFor(() =>
      expect(screen.getByText("Page 2 of 3")).toBeInTheDocument()
    );

    const prevButton = screen.getByRole("button", { name: /Previous/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "http://mockapi.com/api/articles/?page=1"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/NewsPage?page=1", {
        replace: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Oil Prices Drop")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });
  });
});

describe("Search and Filtering", () => {
  const searchPlaceholder = /Search news by title, author, or source.../i;

  beforeEach(async () => {
    mockSuccessfulFetch();
    renderNewsPage();
    await waitFor(() => {
      expect(screen.getByText("Tech Stocks Soar")).toBeInTheDocument();
    });
  });

 // 6.
  it("6. Filters articles by title match", () => {
    const searchInput = screen.getByPlaceholderText(searchPlaceholder);

    fireEvent.change(searchInput, { target: { value: "Oil" } });

    expect(screen.getByText("Oil Prices Drop")).toBeInTheDocument();
    expect(screen.queryByText("Tech Stocks Soar")).not.toBeInTheDocument();
  });
  
  //7.
  it("7. Filters articles by author match (case-insensitive)", () => {
    const searchInput = screen.getByPlaceholderText(searchPlaceholder);

    fireEvent.change(searchInput, { target: { value: "jane doe" } });

    expect(screen.getByText("Tech Stocks Soar")).toBeInTheDocument();
    expect(screen.queryByText("Oil Prices Drop")).not.toBeInTheDocument();
  });

  //8.
  it("8. Filters articles by source match", () => {
    const searchInput = screen.getByPlaceholderText(searchPlaceholder);

    fireEvent.change(searchInput, { target: { value: "CNBC" } });

    expect(screen.getByText("Oil Prices Drop")).toBeInTheDocument();
    expect(screen.queryByText("Tech Stocks Soar")).not.toBeInTheDocument();
  });

  //9.
  it("9. Displays message when no articles match the search", () => {
    const searchInput = screen.getByPlaceholderText(searchPlaceholder);

    fireEvent.change(searchInput, { target: { value: "XYZ_NO_MATCH" } });

    expect(
      screen.getByText(/No articles match your search./i)
    ).toBeInTheDocument();

    expect(screen.queryByText("Tech Stocks Soar")).not.toBeInTheDocument();
  });
});
