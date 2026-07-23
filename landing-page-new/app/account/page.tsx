import { Header } from "../components/Header";
import { Footer } from "../components/LandingSections";
import { AccountDashboard } from "../components/account/AccountDashboard";

export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <AccountDashboard />
      </main>
      <Footer />
    </>
  );
}
