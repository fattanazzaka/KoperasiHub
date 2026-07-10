import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KoperasiHub",
    short_name: "KoperasiHub",
    description: "Pengadaan bersama untuk Koperasi Merah Putih.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: "#C81E1E",
    lang: "id-ID",
  };
}
