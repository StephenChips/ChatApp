import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function NavigateEffect({
  to,
  replace = false,
}: {
  to: string;
  replace?: boolean;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  });

  return null;
}
