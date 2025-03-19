import React, { ReactNode } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import EmojiPopover from "@/components/emoji-popover";

jest.mock("emoji-picker-react", () => {
  return {
    __esModule: true,
    default: ({
      onEmojiClick,
    }: {
      onEmojiClick: ({ emoji }: { emoji: string }) => void;
    }) => (
      <div data-testid="emoji-picker">
        <button
          data-testid="emoji-button-smile"
          onClick={() => onEmojiClick({ emoji: "😊" })}
        >
          😊
        </button>
        <button
          data-testid="emoji-button-heart"
          onClick={() => onEmojiClick({ emoji: "❤️" })}
        >
          ❤️
        </button>
      </div>
    ),
  };
});

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="tooltip" data-open={open}>
      {typeof onOpenChange === "function" && (
        <button
          data-testid="tooltip-toggle"
          onClick={() => onOpenChange(!open)}
        >
          Toggle Tooltip
        </button>
      )}
      {children}
    </div>
  ),
  TooltipContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: ReactNode;
    asChild: boolean;
  }) => (
    <div
      data-testid="tooltip-trigger"
      data-aschild={asChild ? "true" : "false"}
    >
      {children}
    </div>
  ),
  TooltipProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="popover" data-open={open ? "true" : "false"}>
      {typeof onOpenChange === "function" && (
        <button
          data-testid="popover-toggle"
          onClick={() => onOpenChange(!open)}
        >
          Toggle Popover
        </button>
      )}
      {children}
    </div>
  ),
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverTrigger: ({
    children,
    asChild,
  }: {
    children: ReactNode;
    asChild: boolean;
  }) => (
    <div
      data-testid="popover-trigger"
      data-aschild={asChild ? "true" : "false"}
    >
      {children}
    </div>
  ),
}));

describe("EmojiPopover Component", () => {
  const setup = (props = {}) => {
    const defaultProps = {
      onEmojiSelect: jest.fn(),
      hint: "Select an emoji",
      children: <button>Open Emoji Picker</button>,
    };

    return render(<EmojiPopover {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test("renders the component with children", () => {
    setup();
    expect(screen.getByText("Open Emoji Picker")).toBeInTheDocument();
  });

  test("renders with default hint text if not provided", () => {
    render(
      <EmojiPopover onEmojiSelect={jest.fn()}>
        <button>Open Emoji Picker</button>
      </EmojiPopover>
    );

    expect(screen.getByTestId("tooltip-content").textContent).toBe("Emoji");
  });

  test("renders with custom hint text when provided", () => {
    setup({ hint: "Custom Hint" });
    expect(screen.getByTestId("tooltip-content").textContent).toBe(
      "Custom Hint"
    );
  });

  test("opens popover when trigger is clicked", () => {
    setup();

    const popoverToggle = screen.getByTestId("popover-toggle");
    fireEvent.click(popoverToggle);

    const popover = screen.getByTestId("popover");
    expect(popover).toHaveAttribute("data-open", "true");
  });

  test("displays emoji picker when popover is open", () => {
    setup();

    const popoverToggle = screen.getByTestId("popover-toggle");
    fireEvent.click(popoverToggle);

    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  test("calls onEmojiSelect when an emoji is clicked", () => {
    const onEmojiSelect = jest.fn();
    setup({ onEmojiSelect });

    const popoverToggle = screen.getByTestId("popover-toggle");
    fireEvent.click(popoverToggle);

    const emojiButton = screen.getByTestId("emoji-button-smile");
    fireEvent.click(emojiButton);

    expect(onEmojiSelect).toHaveBeenCalledWith("😊");
  });

  test("closes popover after emoji selection", () => {
    setup();

    const popoverToggle = screen.getByTestId("popover-toggle");
    fireEvent.click(popoverToggle);

    const emojiButton = screen.getByTestId("emoji-button-smile");
    fireEvent.click(emojiButton);

    const popover = screen.getByTestId("popover");
    expect(popover).toHaveAttribute("data-open", "false");
  });

  test("closes tooltip after a delay when emoji is selected", () => {
    setup();

    const tooltipToggle = screen.getByTestId("tooltip-toggle");
    fireEvent.click(tooltipToggle);

    const popoverToggle = screen.getByTestId("popover-toggle");
    fireEvent.click(popoverToggle);

    const emojiButton = screen.getByTestId("emoji-button-smile");
    fireEvent.click(emojiButton);

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveAttribute("data-open", "true");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(tooltip).toHaveAttribute("data-open", "false");
  });

  test("tooltip and popover can be toggled independently", () => {
    setup();

    const tooltipToggle = screen.getByTestId("tooltip-toggle");
    const popoverToggle = screen.getByTestId("popover-toggle");

    fireEvent.click(tooltipToggle);
    expect(screen.getByTestId("tooltip")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("popover")).toHaveAttribute("data-open", "false");

    fireEvent.click(popoverToggle);
    expect(screen.getByTestId("tooltip")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("popover")).toHaveAttribute("data-open", "true");

    // Close
    fireEvent.click(tooltipToggle);
    expect(screen.getByTestId("tooltip")).toHaveAttribute("data-open", "false");
    expect(screen.getByTestId("popover")).toHaveAttribute("data-open", "true");
  });
});
