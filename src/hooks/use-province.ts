import { useEffect, useState } from "react";

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

const KEY = "agri.province";

export function useProvince() {
  const [province, setProvinceState] = useState<string>("Limpopo");
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setProvinceState(v);
    } catch {}
  }, []);
  const setProvince = (v: string) => {
    setProvinceState(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };
  return { province, setProvince };
}
