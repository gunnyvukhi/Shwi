import { ChevronRight } from "lucide-react";
import theme from "../../../config/theme";
import './SubmitButton.css'
type Props = {
  label?: string;
};
const SubmitButton: React.FC<Props> = ({ label = 'Submit'}) => {

  return (
    <button type="submit" className="submit-btn" style={{backgroundColor : theme.colors.primary}}>
      {label}
      <ChevronRight size={18} className="submit-icon" />
    </button>
  );
};
export default SubmitButton