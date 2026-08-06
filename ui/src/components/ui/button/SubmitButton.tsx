import { ChevronRight } from "lucide-react";
import theme from "../../../config/theme";
import './SubmitButton.css';

type Props = {
  label?: string;
  disabled?: boolean;
};

const SubmitButton: React.FC<Props> = ({ label = 'Submit', disabled = false }) => {
  return (
    <button
      type="submit"
      className="submit-btn"
      disabled={disabled}
      style={{
        backgroundColor: theme.colors.primary,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {label}
      <ChevronRight size={18} className="submit-icon" />
    </button>
  );
};

export default SubmitButton;