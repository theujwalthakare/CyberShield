import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Shield, AlertTriangle, Phone } from "lucide-react";

const articles = [
  {
    title: "What is Phishing?",
    description:
      "Phishing is a social engineering attack where criminals impersonate legitimate organizations via email, SMS, or fake websites to steal sensitive information like passwords and bank details.",
    tips: [
      "Never click links in unsolicited emails or SMS",
      "Verify the sender's email address carefully",
      "Look for HTTPS and valid certificates on websites",
      "Report phishing attempts to your bank and CERT-In",
    ],
    icon: AlertTriangle,
  },
  {
    title: "Online Financial Fraud",
    description:
      "Fraudsters use fake UPI requests, cloned banking apps, and social engineering to trick victims into transferring money or sharing OTPs.",
    tips: [
      "Never share OTP, PIN, or CVV with anyone",
      "Use official banking apps only from Play Store / App Store",
      "Enable transaction alerts on your bank account",
      "File complaint on cybercrime.gov.in within 24 hours of fraud",
    ],
    icon: Shield,
  },
  {
    title: "Identity Theft Protection",
    description:
      "Identity theft occurs when someone uses your personal information—like Aadhaar, PAN, or bank details—without authorization to commit fraud.",
    tips: [
      "Regularly check your credit report on CIBIL",
      "Use strong, unique passwords for each account",
      "Enable two-factor authentication everywhere",
      "Shred physical documents containing personal info",
    ],
    icon: Shield,
  },
  {
    title: "Cyberstalking & Harassment",
    description:
      "Cyberstalking involves persistent online harassment, threats, or monitoring using digital platforms. It is punishable under IT Act and IPC.",
    tips: [
      "Document all instances with screenshots and timestamps",
      "Block the harasser and adjust privacy settings",
      "Do not engage or respond to the stalker",
      "File FIR at nearest cyber crime cell or cybercrime.gov.in",
    ],
    icon: AlertTriangle,
  },
];

const helplines = [
  { label: "National Cyber Crime Helpline", number: "1930" },
  { label: "Cyber Crime Portal", number: "cybercrime.gov.in" },
  { label: "CERT-In", number: "cert-in.org.in" },
  { label: "Women Helpline", number: "181" },
];

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Knowledge Base
        </h1>
        <p className="text-muted-foreground">
          Learn about common cybercrimes, prevention tips, and how to report
          incidents
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <Card key={article.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <article.icon className="h-5 w-5 text-primary" />
                {article.title}
              </CardTitle>
              <CardDescription>{article.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-semibold mb-2">Prevention Tips:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {article.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Emergency Helplines
          </CardTitle>
          <CardDescription>
            If you are a victim of cybercrime, contact these helplines
            immediately
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {helplines.map((h) => (
              <div
                key={h.label}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm font-medium">{h.label}</span>
                <span className="font-mono text-sm text-primary font-bold">
                  {h.number}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
