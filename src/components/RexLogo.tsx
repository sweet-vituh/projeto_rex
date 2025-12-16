import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RexLogo() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleClick = () => {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "safety_tech":
        navigate("/epi/dashboard");
        break;
      case "almoxarifado":
        navigate("/stock/dashboard");
        break;
      case "pcm":
        navigate("/inbox");
        break;
      case "mechanic":
      default:
        navigate("/modules");
        break;
    }
  };

  return (
    <h1 
      className="text-2xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
      onClick={handleClick}
    >
      Rex
    </h1>
  );
}