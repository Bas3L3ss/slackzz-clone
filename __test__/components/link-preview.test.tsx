import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LinkPreview from "@/components/link-previewer";

global.fetch = jest.fn();
global.window.open = jest.fn();

// @ts-expect-error: no prob
global.URL = jest.fn().mockImplementation((url) => {
  let hostname = "";
  let protocol = "";

  if (url.includes("github.com")) {
    hostname = "github.com";
    protocol = "https:";
  } else if (url.includes("youtube.com")) {
    hostname = "youtube.com";
    protocol = "https:";
  } else if (url.includes("youtu.be")) {
    hostname = "youtu.be";
    protocol = "https:";
  } else if (url.includes("example.com")) {
    hostname = "example.com";
    protocol = "https:";
  } else {
    hostname = "invalid.com";
    protocol = "https:";
  }

  return {
    hostname,
    protocol,
    toString: () => url,
  };
});

describe("LinkPreview Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<LinkPreview url="https://github.com/Bas3L3ss/apple-store" />);

    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders regular link preview when metadata is available", async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Apple Store Repository",
          description: "A GitHub repository for Apple Store clone",
          image: "https://example.com/image.jpg",
        }),
    });

    render(<LinkPreview url="https://github.com/Bas3L3ss/apple-store" />);

    await waitFor(() => {
      expect(screen.getByText("Apple Store Repository")).toBeInTheDocument();
      expect(
        screen.getByText("A GitHub repository for Apple Store clone")
      ).toBeInTheDocument();
      expect(screen.getByText("github.com")).toBeInTheDocument();
      expect(screen.getByText("Open link")).toBeInTheDocument();
    });
  });

  it("renders YouTube preview when URL is a YouTube link", async () => {
    // Mock YouTube oembed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Test YouTube Video",
          author_name: "Test Channel",
          thumbnail_url: "https://example.com/thumbnail.jpg",
        }),
    });

    render(<LinkPreview url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);

    await waitFor(() => {
      expect(screen.getByText("Test YouTube Video")).toBeInTheDocument();
      expect(screen.getByText("Test Channel")).toBeInTheDocument();
      expect(screen.getByText("youtube.com")).toBeInTheDocument();
      expect(screen.getByText("Watch video")).toBeInTheDocument();
    });
  });

  it("renders error state when API call fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    render(<LinkPreview url="https://example.com" />);

    await waitFor(() => {
      expect(screen.getByText(/Invalid url/i)).toBeInTheDocument();
      expect(screen.getByText(/Be cautious/i)).toBeInTheDocument();
    });
  });

  it("renders error state when URL is invalid", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Invalid URL");
    });

    render(<LinkPreview url="invalid-url" />);

    await waitFor(() => {
      expect(screen.getByText(/Invalid url/i)).toBeInTheDocument();
    });
  });

  it("opens link in new tab when clicked", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Test Link",
          description: "Test Description",
          image: null,
        }),
    });

    render(<LinkPreview url="https://example.com" />);

    await waitFor(() => {
      expect(screen.getByText("Test Link")).toBeInTheDocument();
    });

    const card = screen.getByRole("button");
    await user.click(card);

    expect(window.open).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("handles image load errors correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Test Link",
          description: "Test Description",
          image: "https://example.com/broken-image.jpg",
        }),
    });

    render(<LinkPreview url="https://example.com" />);

    await waitFor(() => {
      expect(screen.getByText("Test Link")).toBeInTheDocument();
    });

    const image = screen.getByAltText("Test Link");
    fireEvent.error(image);

    // After image error, the image should be hidden
    expect(image).not.toBeVisible();
  });

  it("handles YouTube video ID extraction correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Video Title",
          author_name: "Video Author",
          thumbnail_url: "https://example.com/thumbnail.jpg",
        }),
    });

    render(<LinkPreview url="https://youtu.be/dQw4w9WgXcQ" />);

    await waitFor(() => {
      expect(screen.getByText("Video Title")).toBeInTheDocument();
      expect(screen.getByText("Video Author")).toBeInTheDocument();
      expect(screen.getByAltText("Video Thumbnail")).toBeInTheDocument();
    });
  });

  it("displays callback error when onError prop is provided", async () => {
    const onErrorMock = jest.fn();

    // Mock fetch to throw an error
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Test Error");
    });

    render(<LinkPreview url="https://invalid.com" onError={onErrorMock} />);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
