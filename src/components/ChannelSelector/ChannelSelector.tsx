import { Button } from "antd";
import "./ChannelSelector.css";

interface ChannelButton {
  id: string;
  label: string;
  isActive: boolean;
  conflictsWith?: string[];
  multipliers: { "2D": number; "3D": number };
}

interface PButton {
  id: string;
  label: string;
  isActive: boolean;
  channelsToActivate: string[];
}

interface ChannelSelectorProps {
  channelsButtons: ChannelButton[];
  pButtons: PButton[];
  setChannelsButtons: React.Dispatch<React.SetStateAction<ChannelButton[]>>;
  setPButtons: React.Dispatch<React.SetStateAction<PButton[]>>;
  selectedServerTime: string | undefined;
}

/** ChannelSelector component for rendering and managing channel and P buttons.
 * Handles toggling of channel buttons with conflict resolution and P buttons to activate multiple channels.
 * @param channelsButtons List of channel buttons with their state and multipliers.
 * @param pButtons List of P buttons with their state and associated channels.
 * @param setChannelsButtons Function to update channel buttons state.
 * @param setPButtons Function to update P buttons state.
 * @param selectedServerTime The selected server time ID, used to enable/disable buttons.
 */
const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channelsButtons,
  pButtons,
  setChannelsButtons,
  setPButtons,
  selectedServerTime,
}) => {
  /** Toggle a channel button and handle conflicts (e.g., Lo conflicts with A, B, C, D).
   * Deactivates all P buttons when a channel button is clicked.
   * @param clickedId The ID of the clicked channel button.
   */
  const handleChannelButtonClick = (clickedId: string) => {
    setPButtons((prevPButtons) =>
      prevPButtons.map((button) => ({ ...button, isActive: false }))
    );
    setChannelsButtons((prevChannelsButtons) => {
      const clickedButton = prevChannelsButtons.find(
        (button) => button.id === clickedId
      );
      if (!clickedButton) return prevChannelsButtons;

      if (clickedButton.isActive) {
        // Deactivate the clicked button
        return prevChannelsButtons.map((button) =>
          button.id === clickedId ? { ...button, isActive: false } : button
        );
      }

      // Activate clicked button and deactivate conflicting buttons
      const conflictsToDeactivate = clickedButton.conflictsWith || [];
      return prevChannelsButtons.map((button) => {
        if (button.id === clickedId) {
          return { ...button, isActive: true };
        } else if (conflictsToDeactivate.includes(button.id)) {
          return { ...button, isActive: false };
        }
        return button;
      });
    });
  };

  /** Toggle a P button and activate its associated channels.
   * Deactivates other P buttons and updates channel states.
   * @param clickedId The ID of the clicked P button.
   */
  const handlePButtonClick = (clickedId: string) => {
    setPButtons((prevPButtons) => {
      const clickedPButton = prevPButtons.find(
        (button) => button.id === clickedId
      );
      if (!clickedPButton) return prevPButtons;

      if (clickedPButton.isActive) {
        // Deactivate P button and all channels
        setChannelsButtons((prevChannels) =>
          prevChannels.map((channel) => ({ ...channel, isActive: false }))
        );
        return prevPButtons.map((button) => ({ ...button, isActive: false }));
      }

      // Activate clicked P button and its channels
      const updatedPButtons = prevPButtons.map((button) => ({
        ...button,
        isActive: button.id === clickedId,
      }));

      const channelsToActivate = clickedPButton.channelsToActivate;
      setChannelsButtons((prevChannels) =>
        prevChannels.map((channel) => ({
          ...channel,
          isActive: channelsToActivate.includes(channel.id),
        }))
      );

      return updatedPButtons;
    });
  };

  return (
    <div className="middle-controls-container">
      <div className="middle-controls-left-column">
        {channelsButtons.map((button) => (
          <Button
            key={button.id}
            onClick={() => handleChannelButtonClick(button.id)}
            className={`middle-control-button ${
              button.isActive ? "active" : ""
            }`}
            disabled={!selectedServerTime}
            aria-label={`Channel ${button.label}`}
            aria-pressed={button.isActive}
          >
            {button.label} ({button.multipliers["2D"]},{" "}
            {button.multipliers["3D"]})
          </Button>
        ))}
      </div>
      <div className="middle-controls-separator"></div>
      <div className="middle-controls-right-column">
        {pButtons.map((button) => (
          <Button
            key={button.id}
            onClick={() => handlePButtonClick(button.id)}
            className={`middle-control-button p-button ${
              button.isActive ? "active" : ""
            }`}
            disabled={!selectedServerTime}
            aria-label={`P button ${button.label}`}
            aria-pressed={button.isActive}
          >
            {button.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ChannelSelector;
