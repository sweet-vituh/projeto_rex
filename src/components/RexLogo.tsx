import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RexLogo() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleClick = () => {
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "pcm") {
      navigate("/inbox");
    } else {
      navigate("/home");
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
