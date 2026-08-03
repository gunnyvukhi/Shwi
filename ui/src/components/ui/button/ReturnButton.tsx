import { ChevronLeft} from "lucide-react";
import theme from "../../../config/theme";
import './ReturnButton.css'
type Props = {
  label?: string;
};
const ReturnButton: React.FC<Props> = ({ label = 'Submit'}) => {

  return (
    <button type="submit" className="submit-btn" style={{backgroundColor : theme.colors.primary}}>
      <ChevronLeft size={18} className="submit-icon" />
      {label}
    </button>
  );
};
export default ReturnButton