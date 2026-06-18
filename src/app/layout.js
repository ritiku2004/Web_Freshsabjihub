import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./page.module.css";

export const metadata = {
  title: "Fresh Sabji Hub - Fresh Vegetables & Groceries Delivered",
  description: "Get fresh organic vegetables and daily essentials delivered right to your doorstep from Fresh Sabji Hub.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className={styles.mainContainer}>
            <Navbar />
            <main className={styles.contentContainer}>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
