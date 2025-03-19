import { UseGetChannels } from "@/features/channels/api/use-get-channels";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useCreateChannelModal } from "@/features/channels/store/use-get-channel-modal";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import WorkspaceIdPage from "@/app/workspace/[workspaceId]/page";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock the hooks and modules
jest.mock("@/features/channels/api/use-get-channels", () => ({
  UseGetChannels: jest.fn(),
}));

jest.mock("@/features/members/api/use-current-member", () => ({
  useCurrentMember: jest.fn(),
}));

jest.mock("@/features/workspaces/api/use-get-workspace", () => ({
  useGetWorkspace: jest.fn(),
}));

jest.mock("@/features/channels/store/use-get-channel-modal", () => ({
  useCreateChannelModal: jest.fn(),
}));

jest.mock("@/hooks/use-workspace-id", () => ({
  useWorkSpaceId: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  Loader: () => <div data-testid="loader">Loader</div>,
  TriangleAlert: () => <div data-testid="triangle-alert">Triangle Alert</div>,
}));

describe("WorkspaceIdPage", () => {
  const mockWorkspaceId = "workspace-123";
  const mockRouter = { push: jest.fn() };
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useWorkSpaceId as jest.Mock).mockReturnValue(mockWorkspaceId);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useCreateChannelModal as jest.Mock).mockReturnValue([false, mockSetOpen]);
  });

  test("renders loading state when data is loading", () => {
    (useCurrentMember as jest.Mock).mockReturnValue({ isLoading: true });
    (useGetWorkspace as jest.Mock).mockReturnValue({ isLoading: true });
    (UseGetChannels as jest.Mock).mockReturnValue({ isLoading: true });

    render(<WorkspaceIdPage />);

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  test("renders 'Workspace not found' when workspace data is not available", () => {
    (useCurrentMember as jest.Mock).mockReturnValue({
      data: { role: "member" },
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    expect(screen.getByTestId("triangle-alert")).toBeInTheDocument();
    expect(screen.getByText("Workspace not found")).toBeInTheDocument();
  });

  test("renders 'Workspace not found' when member data is not available", () => {
    (useCurrentMember as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: { name: "Test Workspace" },
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    expect(screen.getByTestId("triangle-alert")).toBeInTheDocument();
    expect(screen.getByText("Workspace not found")).toBeInTheDocument();
  });

  test("renders 'No channel found' when workspace exists but no channels", () => {
    (useCurrentMember as jest.Mock).mockReturnValue({
      data: { role: "member" },
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: { name: "Test Workspace" },
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    expect(screen.getByTestId("triangle-alert")).toBeInTheDocument();
    expect(screen.getByText("No channel found")).toBeInTheDocument();
  });

  test("redirects to channel page when channels exist", async () => {
    const mockChannelId = "channel-123";

    (useCurrentMember as jest.Mock).mockReturnValue({
      data: { role: "member" },
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: { name: "Test Workspace" },
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [{ _id: mockChannelId, name: "General" }],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/workspace/${mockWorkspaceId}/channel/${mockChannelId}`
      );
    });
  });

  test("opens channel creation modal when admin user and no channels", async () => {
    (useCurrentMember as jest.Mock).mockReturnValue({
      data: { role: "admin" },
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: { name: "Test Workspace" },
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    await waitFor(() => {
      expect(mockSetOpen).toHaveBeenCalledWith(true);
    });
  });

  test("does not open channel creation modal when not admin user", async () => {
    (useCurrentMember as jest.Mock).mockReturnValue({
      data: { role: "member" },
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: { name: "Test Workspace" },
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    await waitFor(() => {
      expect(mockSetOpen).not.toHaveBeenCalled();
    });
  });

  test("does not open channel creation modal when it's already open", async () => {
    (useCreateChannelModal as jest.Mock).mockReturnValue([true, mockSetOpen]);

    (useCurrentMember as jest.Mock).mockReturnValue({
      data: { role: "admin" },
      isLoading: false,
    });
    (useGetWorkspace as jest.Mock).mockReturnValue({
      data: { name: "Test Workspace" },
      isLoading: false,
    });
    (UseGetChannels as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkspaceIdPage />);

    await waitFor(() => {
      expect(mockSetOpen).not.toHaveBeenCalled();
    });
  });
});
