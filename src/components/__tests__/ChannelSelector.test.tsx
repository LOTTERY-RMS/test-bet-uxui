import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChannelSelector from "../ChannelSelector/ChannelSelector";

describe("ChannelSelector", () => {
  const mockChannelsButtons = [
    { id: "A", label: "A", isActive: false, conflictsWith: ["Lo"], multipliers: { "2D": 1, "3D": 1 } },
    { id: "B", label: "B", isActive: false, conflictsWith: ["Lo"], multipliers: { "2D": 1, "3D": 1 } },
    { id: "Lo", label: "Lo", isActive: false, conflictsWith: ["A", "B"], multipliers: { "2D": 19, "3D": 23 } },
  ];

  const mockPButtons = [
    { id: "4P", label: "4P", isActive: false, channelsToActivate: ["A", "B"] },
    { id: "5P", label: "5P", isActive: false, channelsToActivate: ["A", "B", "C"] },
  ];

  const mockSetChannelsButtons = vi.fn();
  const mockSetPButtons = vi.fn();

  beforeEach(() => {
    mockSetChannelsButtons.mockClear();
    mockSetPButtons.mockClear();
  });

  it("should render channel buttons", () => {
    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    expect(screen.getByLabelText("Channel A")).toBeInTheDocument();
    expect(screen.getByLabelText("Channel B")).toBeInTheDocument();
    expect(screen.getByLabelText("Channel Lo")).toBeInTheDocument();
  });

  it("should render P buttons", () => {
    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    expect(screen.getByLabelText("P button 4P")).toBeInTheDocument();
    expect(screen.getByLabelText("P button 5P")).toBeInTheDocument();
  });

  it("should display channel multipliers", () => {
    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    expect(screen.getByText("A (1, 1)")).toBeInTheDocument();
    expect(screen.getByText("B (1, 1)")).toBeInTheDocument();
    expect(screen.getByText("Lo (19, 23)")).toBeInTheDocument();
  });

  it("should handle channel button clicks", () => {
    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    fireEvent.click(screen.getByLabelText("Channel A"));
    expect(mockSetChannelsButtons).toHaveBeenCalled();
    expect(mockSetPButtons).toHaveBeenCalled();
  });

  it("should handle P button clicks", () => {
    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    fireEvent.click(screen.getByLabelText("P button 4P"));
    expect(mockSetPButtons).toHaveBeenCalled();
    // Note: setChannelsButtons is called inside setPButtons callback, so it may not be called in test environment
  });

  it("should disable buttons when no server time is selected", () => {
    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime={undefined} />);

    const channelButton = screen.getByLabelText("Channel A");
    const pButton = screen.getByLabelText("P button 4P");

    expect(channelButton).toBeDisabled();
    expect(pButton).toBeDisabled();
  });

  it("should show active state for active channels", () => {
    const activeChannels = [
      { id: "A", label: "A", isActive: true, conflictsWith: ["Lo"], multipliers: { "2D": 1, "3D": 1 } },
      { id: "B", label: "B", isActive: false, conflictsWith: ["Lo"], multipliers: { "2D": 1, "3D": 1 } },
      { id: "Lo", label: "Lo", isActive: false, conflictsWith: ["A", "B"], multipliers: { "2D": 19, "3D": 23 } },
    ];

    render(<ChannelSelector channelsButtons={activeChannels} pButtons={mockPButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    const activeButton = screen.getByLabelText("Channel A");
    expect(activeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("should show active state for active P buttons", () => {
    const activePButtons = [
      { id: "4P", label: "4P", isActive: true, channelsToActivate: ["A", "B"] },
      { id: "5P", label: "5P", isActive: false, channelsToActivate: ["A", "B", "C"] },
    ];

    render(<ChannelSelector channelsButtons={mockChannelsButtons} pButtons={activePButtons} setChannelsButtons={mockSetChannelsButtons} setPButtons={mockSetPButtons} selectedServerTime="test" />);

    const activePButton = screen.getByLabelText("P button 4P");
    expect(activePButton).toHaveAttribute("aria-pressed", "true");
  });
});
