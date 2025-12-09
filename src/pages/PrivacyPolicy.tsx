import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 5, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to SocialPulse. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our 
              website and use our services, and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect and process the following types of information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account.</li>
              <li><strong>Social Media Data:</strong> When you connect your social media accounts (Instagram, TikTok, YouTube), we access your public profile information, posts, and analytics data as authorized by you.</li>
              <li><strong>Usage Data:</strong> Information about how you use our service, including features accessed and actions taken.</li>
              <li><strong>Device Information:</strong> Browser type, IP address, and device identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Display your social media analytics and insights</li>
              <li>Schedule and publish content to your connected social media accounts</li>
              <li>Send you notifications about your account and scheduled posts</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service integrates with third-party platforms including Instagram (Meta), TikTok, and YouTube (Google). 
              When you connect these accounts, you are also subject to their respective privacy policies. We only access 
              the data you explicitly authorize through their OAuth authentication systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction. Your data is stored securely using 
              industry-standard encryption and security practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was 
              collected, including to satisfy any legal, accounting, or reporting requirements. When you disconnect 
              a social media account or delete your account, we will delete the associated data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to enable basic functionality of our service. We may also use analytics 
              cookies to understand how visitors interact with our website. You can control cookie preferences 
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting 
              the new privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: privacy@socialpulse.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
