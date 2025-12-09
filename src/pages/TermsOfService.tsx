import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 5, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using SocialPulse, you agree to be bound by these Terms of Service and all 
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited 
              from using or accessing this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              SocialPulse is a social media management platform that allows users to connect their social media 
              accounts (including Instagram, TikTok, and YouTube), view analytics, schedule posts, and manage 
              their social media presence from a single dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use our service, you must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be at least 18 years old or have parental consent</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Connected Social Media Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you connect your social media accounts to SocialPulse:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You authorize us to access your account data as permitted by the respective platform</li>
              <li>You confirm that you have the authority to connect and manage these accounts</li>
              <li>You agree to comply with the terms of service of each connected platform</li>
              <li>You understand that we are not responsible for changes to third-party platform APIs or policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use SocialPulse to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute spam, malware, or harmful content</li>
              <li>Harass, abuse, or harm others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Resell or redistribute our service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Content Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for all content you create, upload, or publish through our service. 
              We do not claim ownership of your content, but you grant us a limited license to display and 
              process it as necessary to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Subscription and Payments</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you subscribe to a paid plan:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Subscription fees are billed in advance on a recurring basis</li>
              <li>You authorize us to charge your payment method automatically</li>
              <li>Prices may change with 30 days notice</li>
              <li>Refunds are provided in accordance with our refund policy</li>
              <li>You may cancel your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The SocialPulse service, including its design, features, and content (excluding user content), 
              is owned by us and protected by copyright, trademark, and other intellectual property laws. 
              You may not copy, modify, or distribute our service without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, SocialPulse shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including loss of profits, data, 
              or business opportunities, arising from your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is provided "as is" and "as available" without warranties of any kind, either 
              express or implied. We do not guarantee that the service will be uninterrupted, secure, or 
              error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the service immediately, without prior 
              notice, for conduct that we believe violates these Terms of Service or is harmful to other 
              users, us, or third parties, or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email or through the service. Continued use after changes constitutes acceptance 
              of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without 
              regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: legal@socialpulse.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
