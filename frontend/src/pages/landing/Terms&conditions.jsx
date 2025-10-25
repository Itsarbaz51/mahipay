import React, { useState } from "react";
import {
  FileText,
  Scale,
  CreditCard,
  Users,
  AlertTriangle,
  ShieldCheck,
  Ban,
  Gavel,
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";

const sections = [
  {
    id: 1,
    icon: <FileText className="w-6 h-6 text-indigo-600" />,
    title: "Acceptance of Terms",
    content: [
      {
        subtitle: "Agreement to Terms",
        text: "Monks Pay की services का उपयोग करके, आप इन Terms and Conditions से bound होने के लिए agree करते हैं। यदि आप किसी भी term से disagree करते हैं, तो कृपया हमारी services का उपयोग न करें।",
      },
      {
        subtitle: "Eligibility",
        text: "You must be at least 18 years old and legally capable of entering into binding contracts to use our services. आपको भारत का valid resident होना चाहिए और सभी applicable laws का पालन करना होगा।",
      },
      {
        subtitle: "Account Registration",
        text: "You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.",
      },
    ],
  },
  {
    id: 2,
    icon: <CreditCard className="w-6 h-6 text-purple-600" />,
    title: "Services & Payouts",
    content: [
      {
        subtitle: "Service Description",
        text: "Monks Pay provides credit card payout services that enable instant transfers to credit cards. हम आपके funds को safely और securely process करते हैं।",
      },
      {
        subtitle: "Payout Processing",
        text: "Payouts are typically processed within 5 minutes but may take up to 24-48 hours depending on bank processing times, network issues, or verification requirements.",
      },
      {
        subtitle: "Transaction Limits",
        text: "Daily transaction limits apply based on your account verification level. Minimum payout: ₹100, Maximum: ₹2,00,000 per transaction for fully verified accounts.",
      },
      {
        subtitle: "Service Fees",
        text: "Our standard processing fee is 2% + GST per transaction. Fees are clearly displayed before you confirm any transaction. कोई hidden charges नहीं हैं।",
      },
      {
        subtitle: "Service Availability",
        text: "While we strive for 99.9% uptime, services may be temporarily unavailable due to maintenance, technical issues, or circumstances beyond our control.",
      },
    ],
  },
  {
    id: 3,
    icon: <Users className="w-6 h-6 text-pink-600" />,
    title: "User Responsibilities",
    content: [
      {
        subtitle: "Account Security",
        text: "आप अपने account credentials की सुरक्षा के लिए जिम्मेदार हैं। किसी भी unauthorized access की तुरंत report करें।",
      },
      {
        subtitle: "Accurate Information",
        text: "You must provide truthful and accurate information including KYC documents, bank details, and credit card information. False information may result in account suspension.",
      },
      {
        subtitle: "Prohibited Activities",
        text: "You agree not to use our services for any illegal activities, money laundering, fraud, or any activities that violate Indian laws including IT Act 2000, Payment and Settlement Systems Act 2007.",
      },
      {
        subtitle: "Compliance",
        text: "You agree to comply with all RBI guidelines, AML/CFT regulations, and other applicable financial regulations while using our services.",
      },
    ],
  },
  {
    id: 4,
    icon: <Ban className="w-6 h-6 text-red-600" />,
    title: "Prohibited Uses",
    content: [
      {
        subtitle: "Illegal Activities",
        text: "Using Monks Pay for any illegal purpose, including but not limited to money laundering, terrorist financing, drug trafficking, or any criminal activity is strictly prohibited.",
      },
      {
        subtitle: "Fraudulent Transactions",
        text: "Creating fake accounts, using stolen credit card information, conducting unauthorized transactions, or any form of fraud will result in immediate account termination and legal action.",
      },
      {
        subtitle: "System Abuse",
        text: "Attempting to hack, reverse engineer, or compromise our security systems, using bots or automated systems, or any activity that disrupts our services is prohibited.",
      },
      {
        subtitle: "Gambling & Adult Content",
        text: "Using our services for online gambling, betting, adult entertainment, or any restricted activities as per Indian law is not allowed.",
      },
    ],
  },
  {
    id: 5,
    icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    title: "Refunds & Disputes",
    content: [
      {
        subtitle: "Refund Policy",
        text: "Failed transactions are automatically refunded within 5-7 business days. Service fees for failed transactions are not refundable. हम सभी failed transactions को track करते हैं।",
      },
      {
        subtitle: "Dispute Resolution",
        text: "Any disputes regarding transactions must be reported within 30 days. We will investigate and respond within 15 business days. Decisions made by Monks Pay are final.",
      },
      {
        subtitle: "Chargebacks",
        text: "Unauthorized chargebacks may result in account suspension. All disputes should be raised through our official support channels first.",
      },
      {
        subtitle: "Processing Errors",
        text: "In case of technical errors resulting in duplicate charges or incorrect amounts, we will investigate and rectify within 7-10 business days.",
      },
    ],
  },
  {
    id: 6,
    icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
    title: "Liability & Disclaimers",
    content: [
      {
        subtitle: "Service Disclaimer",
        text: "Services are provided 'as is' without any warranties. हम reasonable efforts करते हैं लेकिन uninterrupted या error-free service की guarantee नहीं दे सकते।",
      },
      {
        subtitle: "Limitation of Liability",
        text: "Monks Pay shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our maximum liability is limited to the amount of fees paid for the specific transaction in question.",
      },
      {
        subtitle: "Third-Party Services",
        text: "We are not responsible for delays or failures caused by banks, payment networks, or other third-party service providers.",
      },
      {
        subtitle: "Force Majeure",
        text: "We are not liable for any failure to perform due to circumstances beyond our control including natural disasters, wars, strikes, government actions, or technical failures.",
      },
    ],
  },
  {
    id: 7,
    icon: <Gavel className="w-6 h-6 text-blue-600" />,
    title: "Account Termination",
    content: [
      {
        subtitle: "Termination by User",
        text: "You may terminate your account at any time by contacting support. Any pending transactions must be completed before account closure.",
      },
      {
        subtitle: "Termination by Monks Pay",
        text: "हम किसी भी समय बिना prior notice के आपका account suspend या terminate कर सकते हैं यदि आप terms violate करते हैं या suspicious activity detected होती है।",
      },
      {
        subtitle: "Effect of Termination",
        text: "Upon termination, your right to use services immediately ceases. Any pending funds will be processed as per our standard procedures. Refunds subject to verification.",
      },
    ],
  },
  {
    id: 8,
    icon: <Scale className="w-6 h-6 text-indigo-600" />,
    title: "Governing Law & Jurisdiction",
    content: [
      {
        subtitle: "Applicable Law",
        text: "These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.",
      },
      {
        subtitle: "Jurisdiction",
        text: "Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of courts in Jaipur, Rajasthan, India.",
      },
      {
        subtitle: "Arbitration",
        text: "Before initiating legal proceedings, parties agree to attempt resolution through good faith negotiation and, if necessary, binding arbitration under Indian Arbitration and Conciliation Act 1996.",
      },
    ],
  },
  {
    id: 9,
    icon: <Globe className="w-6 h-6 text-purple-600" />,
    title: "Intellectual Property",
    content: [
      {
        subtitle: "Ownership",
        text: "All content, features, functionality, including software, text, graphics, logos, and trademarks are owned by Monks Pay and protected by Indian and international copyright laws.",
      },
      {
        subtitle: "License",
        text: "We grant you a limited, non-exclusive, non-transferable license to use our services for personal or business purposes. आप हमारे intellectual property को modify, copy, या distribute नहीं कर सकते।",
      },
      {
        subtitle: "Feedback",
        text: "Any suggestions or feedback you provide may be used by Monks Pay without any obligation to compensate you.",
      },
    ],
  },
];

const quickLinks = [
  { name: "Acceptance of Terms", id: 1 },
  { name: "Services & Payouts", id: 2 },
  { name: "User Responsibilities", id: 3 },
  { name: "Prohibited Uses", id: 4 },
  { name: "Refunds & Disputes", id: 5 },
  { name: "Liability", id: 6 },
  { name: "Termination", id: 7 },
  { name: "Governing Law", id: 8 },
  { name: "Intellectual Property", id: 9 },
];

const keyPoints = [
  {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    text: "Must be 18+ years old to use services",
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    text: "2% + GST processing fee per transaction",
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    text: "Payouts processed within 5 minutes typically",
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    text: "Maximum ₹2,00,000 per transaction limit",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    text: "No illegal activities or fraud permitted",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    text: "Unauthorized access results in termination",
  },
];

function TermsConditions() {
  const [expandedSections, setExpandedSections] = useState([1]);

  const toggleSection = (id) => {
    setExpandedSections((prev) =>
      prev.includes(id)
        ? prev.filter((sectionId) => sectionId !== id)
        : [...prev, id]
    );
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!expandedSections.includes(id)) {
        setExpandedSections((prev) => [...prev, id]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white" id="terms-conditions">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Scale className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Terms & Conditions
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-4">
            कृपया सेवा का उपयोग करने से पहले ध्यान से पढ़ें
          </p>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Last Updated: January 25, 2025 | Effective Date: January 25, 2025
          </p>
        </div>
      </section>

      {/* Key Points Banner */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Quick Overview
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-sm"
              >
                {point.icon}
                <span className="text-sm text-gray-700">{point.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  Quick Navigation
                </h3>
                <nav className="space-y-2">
                  {quickLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="block w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition text-sm"
                    >
                      {link.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* Introduction */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Monks Pay Terms of Service
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  ये Terms and Conditions ("Terms") Monks Pay Private Limited
                  ("Monks Pay," "we," "us," या "our") द्वारा प्रदान की जाने वाली
                  credit card payout services के उपयोग को regulate करते हैं।
                  हमारी website, mobile application, या किसी भी related services
                  (collectively, "Services") का उपयोग करके, आप इन Terms से bound
                  होने के लिए agree करते हैं।
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms constitute a legally binding agreement between you
                  and Monks Pay. If you do not agree with any part of these
                  Terms, you must not use our Services.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-900">
                      <strong>Important Notice:</strong> कृपया इन Terms को ध्यान
                      से पढ़ें और समझें। हमारी Services का उपयोग करके, आप इन
                      Terms को स्वीकार करते हैं और उनका पालन करने के लिए सहमत
                      होते हैं।
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable Sections */}
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    id={`section-${section.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {section.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-left">
                          {section.title}
                        </h3>
                      </div>
                      {expandedSections.includes(section.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {expandedSections.includes(section.id) && (
                      <div className="px-6 pb-6 space-y-6">
                        {section.content.map((item, idx) => (
                          <div key={idx}>
                            <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                              {item.subtitle}
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Additional Important Sections */}
              <div className="mt-8 space-y-8">
                {/* Amendments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Amendments to Terms
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    हम किसी भी समय इन Terms को modify या replace कर सकते हैं।
                    यदि revision material है, तो हम नए terms के effective होने
                    से कम से कम 30 days पहले notice provide करने का प्रयास
                    करेंगे।
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Revised Terms के effective होने के बाद Services का continued
                    use आपकी उन changes को accept करने की agreement मानी जाएगी।
                    यदि आप नए Terms से सहमत नहीं हैं, तो आपको Services का उपयोग
                    बंद कर देना चाहिए।
                  </p>
                </div>

                {/* Severability */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Severability & Waiver
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    <strong>Severability:</strong> यदि इन Terms का कोई provision
                    invalid या unenforceable पाया जाता है, तो वह provision हटा
                    दिया जाएगा और बाकी Terms पूर्ण force और effect में बने
                    रहेंगे।
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Waiver:</strong> किसी भी right या provision को
                    enforce करने में हमारी failure को उस right या provision की
                    waiver नहीं माना जाएगा।
                  </p>
                </div>

                {/* Entire Agreement */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Entire Agreement
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    These Terms, along with our Privacy Policy and any other
                    legal notices published by us, constitute the entire
                    agreement between you and Monks Pay regarding the Services.
                    ये Terms किसी भी prior agreements या understandings को
                    supersede करते हैं।
                  </p>
                </div>

                {/* Contact for Terms */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Questions About Terms?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    यदि आपके इन Terms के बारे में कोई questions हैं, तो कृपया
                    हमसे संपर्क करें:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Email</p>
                        <p className="text-gray-700">legal@monkspay.com</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Globe className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Registered Office
                        </p>
                        <p className="text-gray-700">
                          Monks Pay Private Limited
                          <br />
                          123 Business Tower, Jaipur, Rajasthan 302001, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acknowledgment Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              By Using Monks Pay, You Acknowledge
            </h2>
            <ul className="text-left space-y-3 mb-8 max-w-2xl mx-auto">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  आपने इन Terms and Conditions को पढ़ा और समझा है
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  You agree to be bound by these Terms
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  आप 18 वर्ष या उससे अधिक आयु के हैं
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  You have the legal capacity to enter into this agreement
                </span>
              </li>
            </ul>
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition">
              I Accept the Terms
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start with Monks Pay?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Safe, secure, और instant credit card payouts के लिए आज ही sign up
            करें
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg">
              Create Account
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsConditions;
