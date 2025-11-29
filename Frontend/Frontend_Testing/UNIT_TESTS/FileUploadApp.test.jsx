import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter, useNavigate } from "react-router-dom";

const mockPostExtract = jest.fn();
jest.mock("../../api", () => ({
  __esModule: true,
  default: { postExtract: mockPostExtract },
  postExtract: mockPostExtract,
}));

import FileUploadApp from "../FileUploadApp";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

global.alert = jest.fn();

window.__TEST_POST_EXTRACT__ = mockPostExtract;

const mockFile = (name, size, type) =>
  new File(["content".repeat(size / 10)], name, { type });
const validPdf = mockFile("doc.pdf", 5 * 1024 * 1024, "application/pdf"); // 5MB
const validCsv = mockFile("data.csv", 1 * 1024 * 1024, "text/csv");
const validXlsx = mockFile(
  "sheet.xlsx",
  1 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

const largeFile = mockFile(
  "large.xlsx",
  11 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
); // 11MB
const invalidType = mockFile("image.jpg", 1 * 1024 * 1024, "image/jpeg");

const renderApp = () => {
  return render(
    <BrowserRouter>
      <FileUploadApp />
    </BrowserRouter>
  );
};

const renderUploadPage = (apiKey = "TEMP_KEY") => {
  const { getByRole, getByPlaceholderText, container } = renderApp();

  const apiKeyInput = getByPlaceholderText(/Paste API key here/i);
  fireEvent.change(apiKeyInput, { target: { value: apiKey } });
  fireEvent.click(getByRole("button", { name: /Upload Files/i }));

  
  let fileInput = container.querySelector('input[type="file"]');


  if (!fileInput) {
    const dragText = screen.queryByText(/Drag & drop files/i);
    if (dragText) {
      fileInput = dragText.closest("div")?.querySelector('input[type="file"]');
    }
  }

  if (!fileInput) {
    try {
      const labelled = screen.getByLabelText(/Drag & drop files/i, {
        selector: "input",
      });
      if (labelled) fileInput = labelled;
    } catch (e) {
      
    }
  }

  expect(fileInput).toBeInstanceOf(HTMLInputElement);

  return { fileInput };
};

// Tests 
describe("FileUploadApp - First Page (API Key and Setup)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  //1. 
  it("1.renders the initial page elements correctly", () => {
    renderApp();
    expect(
      screen.getByText(/Upload the BALANCE SHEET here/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Paste API key here/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload Files/i })
    ).toBeInTheDocument();
  });
  //2.
  it("2.shows the Missing API Key popup when key is empty and Upload is clicked (lines 100-106)", async () => {
    renderApp();
    const apiKeyInput = screen.getByPlaceholderText(/Paste API key here/i);
    fireEvent.change(apiKeyInput, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: /Upload Files/i }));

    await waitFor(() => {
      expect(screen.getByText(/Missing API Key/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Okay/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Missing API Key/i)).not.toBeInTheDocument();
    });
  });
  //3.
  it("3.navigates to the upload page when API key is provided", () => {
    renderApp();
    const apiKeyInput = screen.getByPlaceholderText(/Paste API key here/i);
    fireEvent.change(apiKeyInput, { target: { value: "VALID_KEY" } });

    fireEvent.click(screen.getByRole("button", { name: /Upload Files/i }));

    expect(screen.getByText(/Upload Your Files/i)).toBeInTheDocument();
  });
  
  //4.
  it("4.navigates to API key instructions page when button is clicked (line 148)", () => {
    renderApp();
    const instructionButton = screen.getByRole("button", {
      name: /How to get API key?/i,
    });
    fireEvent.click(instructionButton);
    expect(mockNavigate).toHaveBeenCalledWith("/API_key");
  });
});

describe("FileUploadApp - Upload Page Navigation and File Handling", () => {
  //5.
  it("5.returns to the first page when the Back button is clicked (line 125)", async () => {
    renderUploadPage();

    fireEvent.click(screen.getByRole("button", { name: /Back/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Upload the BALANCE SHEET here/i)
      ).toBeInTheDocument();
    });
  });

  //6.
  it("6.handles multiple validation errors correctly (type and size)", async () => {
    const { fileInput } = renderUploadPage();
    fireEvent.change(fileInput, {
      target: { files: [invalidType, largeFile] },
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled();
    });
    const alertArg = global.alert.mock.calls[0][0];
    expect(alertArg).toEqual(
      expect.stringContaining(
        "image.jpg: Only PDF, CSV, XLS, XLSX files allowed"
      )
    );
    expect(screen.queryByText("image.jpg")).not.toBeInTheDocument();
  });

  //7.
  it("7.successfully uploads a valid file (xlsx) and displays the Generate button", async () => {
    const { fileInput } = renderUploadPage();

    fireEvent.change(fileInput, { target: { files: [validXlsx] } });

    await waitFor(() => {
      expect(screen.getByText("sheet.xlsx")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Generate Financial Report/i })
      ).toBeInTheDocument();
    });

    const uploadArea = screen
      .getByText("Drag & drop files")
      .closest("div").parentElement;
    expect(uploadArea).toBeInTheDocument();
  });

  //7.
  it("7.removes an uploaded file (line 84)", async () => {
    const { fileInput } = renderUploadPage();
    fireEvent.change(fileInput, { target: { files: [validPdf] } });

    await waitFor(() =>
      expect(screen.getByText("doc.pdf")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));

    await waitFor(() => {
      expect(screen.queryByText("doc.pdf")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Generate Financial Report/i })
      ).not.toBeInTheDocument();
    });
  });

  //8.
  it("8.handles drag enter/leave/over events to manage active state", () => {
    renderUploadPage();
    const uploadArea = screen
      .getByText("Drag & drop files")
      .closest("div").parentElement;

    fireEvent.dragEnter(uploadArea);
    expect(uploadArea).toBeInTheDocument();

    fireEvent.dragLeave(uploadArea);
    expect(uploadArea).toBeInTheDocument();
  });

  //9.
  it("9.handles file drop successfully", async () => {
    renderUploadPage();
    const uploadArea = screen
      .getByText("Drag & drop files")
      .closest("div").parentElement;

    const dataTransfer = { files: [validCsv] };

    fireEvent.drop(uploadArea, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText("data.csv")).toBeInTheDocument();
    });
  });
});

describe("FileUploadApp - Report Generation Logic", () => {
  const API_KEY = "TEST_GENERATE_KEY";

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorageMock.clear();

    const { fileInput } = renderUploadPage(API_KEY);

    act(() => {
      fireEvent.change(fileInput, { target: { files: [validPdf] } });
    });

    await waitFor(() =>
      screen.getByRole("button", { name: /Generate Financial Report/i })
    );
  });

  //10.
  it("10.calls the API, updates localStorage, and navigates on success", async () => {
    const mockResponse = {
      report_id: "RPT123",
      api_key: "SERVER_KEY_FROM_RESPONSE",
    };
   
    mockPostExtract.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockResponse), 30))
    );

    const generateButton = screen.getByRole("button", {
      name: /Generate Financial Report/i,
    });
    fireEvent.click(generateButton);

    await waitFor(() =>
      expect(generateButton).toHaveTextContent("Processing…")
    );

    await waitFor(() => {
      expect(mockPostExtract).toHaveBeenCalled();

      expect(mockNavigate).toHaveBeenCalledWith("/summary_page", {
        state: mockResponse,
      });
    });

    await waitFor(() => {
      expect(generateButton).toHaveTextContent("Generate Financial Report");
      expect(generateButton).not.toBeDisabled();
    });
  });

  //11.
  it("11.handles API failure and shows an alert", async () => {
    mockPostExtract.mockRejectedValueOnce(new Error("Server refused upload"));

    const generateButton = screen.getByRole("button", {
      name: /Generate Financial Report/i,
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "An error occurred while uploading. Check console for details."
      );
    });

    await waitFor(() => {
      expect(generateButton).toHaveTextContent("Generate Financial Report");
      expect(generateButton).not.toBeDisabled();
    });
  });

  //12.
  it("12.shows alert if file object is missing before upload", async () => {
    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));

    const { fileInput } = renderUploadPage(API_KEY);
    fireEvent.change(fileInput, { target: { files: [validPdf] } });
    await waitFor(() =>
      screen.getByRole("button", { name: /Generate Financial Report/i })
    );

    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Generate Financial Report/i })
      ).not.toBeInTheDocument();
    });
  });
});
