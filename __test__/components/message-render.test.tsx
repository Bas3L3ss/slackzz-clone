import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Renderer from "@/components/renderer";
import { Id } from "../../convex/_generated/dataModel";

jest.mock("quill", () => {
  const QuillMock = jest.fn().mockImplementation(() => ({
    enable: jest.fn(),
    setContents: jest.fn(),
    getText: jest.fn().mockReturnValue("Sample text"),
    root: {
      innerHTML: "<p>Sample rendered HTML</p>",
    },
  }));

  //@ts-expect-error: no prob
  QuillMock.register = jest.fn();

  return QuillMock;
});

jest.mock("quill-mention/autoregister", () => ({}));
jest.mock("quill-magic-url", () => ({}));
jest.mock("@/components/link-previewer", () => {
  return function LinkPreviewMock({ url }: { url: string }) {
    return (
      <div data-testid="link-preview" data-url={url}>
        Link Preview
      </div>
    );
  };
});

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({
    has: jest.fn().mockImplementation((param) => {
      if (param === "parentMessageId") return false;
      return false;
    }),
  })),
}));

describe("Renderer Component", () => {
  // Helper function to create a valid Quill Delta JSON string
  const createQuillContent = (withText: boolean) => {
    return withText
      ? JSON.stringify({
          ops: [{ insert: "Sample text\n" }],
        })
      : JSON.stringify({});
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(HTMLDivElement.prototype, "innerHTML", "get")
      .mockImplementation(() => "<p>Sample rendered HTML</p>");
    jest
      .spyOn(HTMLDivElement.prototype, "innerHTML", "set")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders Quill content correctly", () => {
    const quillContent = createQuillContent(true);

    render(<Renderer value={quillContent} links={[]} />);

    const rendererElement = document.querySelector(".ql-renderer");

    expect(rendererElement).toBeInTheDocument();
  });

  test("renders link previews when links are provided", () => {
    const quillContent = createQuillContent(true);
    const links = ["https://example.com", "https://test.com"];

    render(<Renderer value={quillContent} links={links} />);

    const linkPreviews = screen.getAllByTestId("link-preview");

    expect(linkPreviews).toHaveLength(2);
    expect(linkPreviews[0]).toHaveAttribute("data-url", links[0]);
    expect(linkPreviews[1]).toHaveAttribute("data-url", links[1]);
  });

  test("does not render link previews when parentMessageId parameter exists", () => {
    require("next/navigation").useSearchParams.mockReturnValue({
      has: jest.fn().mockImplementation((param) => param === "parentMessageId"),
    });

    const quillContent = createQuillContent(true);
    const links = ["https://example.com"];

    render(<Renderer value={quillContent} links={links} />);

    const linkPreviews = screen.queryAllByTestId("link-preview");
    expect(linkPreviews).toHaveLength(0);
  });

  test("assigns messageId as id attribute when provided", () => {
    const quillContent = createQuillContent(true);
    const messageId = "test-message-id" as Id<"messages">;

    render(<Renderer value={quillContent} links={[]} messageId={messageId} />);

    const rendererElement = document.querySelector(`#${messageId}`);
    expect(rendererElement).toBeInTheDocument();
  });

  test("handles JSON parsing errors gracefully", () => {
    console.error = jest.fn(); // Mock console.error to prevent test output noise

    const invalidContent = "{invalid json";

    const { container } = render(
      <Renderer value={invalidContent} links={[]} />
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error parsing Quill content:",
      expect.any(Error)
    );
    expect(container.firstChild).toBeNull();
  });

  test("cleans up innerHTML on unmount", () => {
    const quillContent = createQuillContent(true);

    const { unmount } = render(<Renderer value={quillContent} links={[]} />);

    const innerHTMLSetter = jest.spyOn(
      HTMLDivElement.prototype,
      "innerHTML",
      "set"
    );

    unmount();

    expect(innerHTMLSetter).toHaveBeenCalledWith("");
  });

  test("renders nothing when content is empty", () => {
    require("quill").mockImplementation(() => ({
      enable: jest.fn(),
      setContents: jest.fn(),
      getText: jest.fn().mockReturnValue(""),
      root: {
        innerHTML: "",
      },
    }));

    render(<Renderer value={"{}"} links={[]} />);

    const rendererElement = document.querySelector(".ql-renderer");

    expect(rendererElement).toBeNull();
  });
});
