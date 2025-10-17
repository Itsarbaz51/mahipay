import {
  CheckCircle,
  CreditCard,
  Receipt,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: <CreditCard className="w-10 h-10 text-indigo-600" />,
    title: "Instant payments",
    desc: "Send money to friends or family in real-time, for free.",
    bg: "bg-indigo-50",
  },
  {
    icon: <Receipt className="w-10 h-10 text-purple-600" />,
    title: "No hidden fees",
    desc: "Clear and simple pricing. Always be aware of your costs.",
    bg: "bg-purple-50",
  },
  {
    icon: <Wallet className="w-10 h-10 text-blue-600" />,
    title: "Digital wallet",
    desc: "Store money securely and make fast transfers or purchases.",
    bg: "bg-blue-50",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-pink-600" />,
    title: "Secure transactions",
    desc: "End-to-end encryption for all transactions.",
    bg: "bg-pink-50",
  },
];

const stats = [
  { value: "60%", label: "Project Complete" },
  { value: "30+", label: "Team Members" },
  { value: "40K", label: "Satisfied Clients" },
];

const logos = [
  "/logos/logo1.png",
  "/logos/logo2.png",
  "/logos/logo3.png",
  "/logos/logo4.png",
  "/logos/logo5.png",
  "/logos/logo6.png",
  "/logos/logo7.png",
];

const testimonials = [
  {
    stars: 5,
    text: "Experience a payment app built on simplicity and transparency. No hidden fees, just a seamless user experience that makes every transaction easy and stress-free. Say goodbye to confusion and hello to straightforward payments.",
    name: "Ethan Williams",
    role: "Digital Marketing Specialist",
    image:
      "https://framerusercontent.com/images/E9Pk9l23ZZndevSt2ZGB9CymVs.png", // Replace with actual image path or URL
  },
  {
    stars: 5,
    text: "Discover a payment app focused on simplicity and transparency. Enjoy a seamless experience with no hidden fees, providing clarity and ease in every transaction. It’s designed to put you in control of your payments.",
    name: "Daniel Thompson",
    role: "Product Designer",
    image:
      "https://framerusercontent.com/images/7EQDf9GDrGroJq6Kgo7TFQtX8I.png",
  },
];

function Home() {
  return (
    <>
      {/* hero  */}
      <section className="relative bg-gradient-to-r from-indigo-50 via-white to-purple-100 overflow-hidden">
        <div className="container mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
              Easy Payment
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mt-4 leading-tight">
              Pay{" "}
              <span className="relative">
                <span className="relative z-10">fast and smarter</span>
                <span className="absolute left-0 bottom-1 w-full h-2 bg-blue-300 z-0 rounded"></span>
              </span>{" "}
              from anywhere
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg">
              Experience the future of payments: fast, secure, and tailored for
              the next generation&apos;s convenience and trust.
            </p>

            {/* Store Buttons */}
            <div className="flex items-center space-x-4 mt-8">
              <img
                src="https://framerusercontent.com/images/ry66Qyyg1zpRs3IhmFE1OeVwdNo.svg"
                alt="App Store"
                className="h-12"
              />
              <img
                src="https://framerusercontent.com/images/EMMY1UCV6GVWkqvfNOfXta3sW8.svg"
                alt="Google Play"
                className="h-12"
              />
            </div>

            {/* Features */}
            <div className="flex items-center space-x-6 mt-6 text-gray-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-gray-500 w-5 h-5" />
                <span>No card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-gray-500 w-5 h-5" />
                <span>Fast acceptance</span>
              </div>
            </div>
          </div>

          {/* Right Side Image */}
          <div className="relative">
            <img
              src="https://framerusercontent.com/images/nDsLG8puSkQec2oTT1odpXPkBh8.png?scale-down-to=1024"
              alt="Hero"
              className="relative z-10 w-[28rem] mx-24"
            />

            {/* Floating Card: Users */}
            <div className="absolute top-10 right-10 bg-white shadow-lg rounded-xl px-4 py-3 flex items-center space-x-3">
              <div className="flex -space-x-2">
                <img
                  src="https://framerusercontent.com/images/7EQDf9GDrGroJq6Kgo7TFQtX8I.png"
                  alt="user1"
                  className="w-8 h-8 rounded-full border"
                />
                <img
                  src="https://framerusercontent.com/images/E9Pk9l23ZZndevSt2ZGB9CymVs.png"
                  alt="user2"
                  className="w-8 h-8 rounded-full border"
                />
                <img
                  src="https://framerusercontent.com/images/oN9Gk4DXOH7MoIC4EzE1kJg.png"
                  alt="user3"
                  className="w-8 h-8 rounded-full border"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">120K+</p>
                <p className="text-xs text-gray-500">Active users</p>
              </div>
            </div>

            {/* Floating Card: Payment */}
            <div className="absolute bottom-10 left-5 bg-white shadow-lg rounded-xl px-4 py-3">
              <p className="text-sm text-gray-500">Payment Received</p>
              <p className="text-xl font-bold text-blue-600">+35,890.00</p>
              <p className="text-xs text-gray-500">1st Jan, 2024</p>
              <p className="text-xs text-green-500 font-semibold">3.09% ↑</p>
            </div>
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          {/* Heading */}
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            Why choose Monks Pay for effortless payments?
          </h2>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.bg} p-8 rounded-2xl shadow-sm hover:shadow-md transition`}
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* total usage  */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto bg-gray-50 rounded-xl shadow-md flex flex-col md:flex-row justify-around items-center p-8 space-y-6 md:space-y-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-gray-500 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-hidden relative bg-gray-50 py-6">
        <div className="animate-marquee flex space-x-8">
          {logos.concat(logos).map((logo, idx) => (
            <img
              key={idx}
              src={logo}
              alt="logo"
              className="h-12 w-auto object-contain"
            />
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div
          className="relative rounded-2xl overflow-hidden bg-cover bg-center flex flex-col items-center justify-center text-center px-6 py-16 md:py-24"
          style={{
            backgroundImage: "url('https://via.placeholder.com/1200x500')", // Replace with actual image URL
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>

          <div className="relative z-10 text-white max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to experience seamless <br />
              secure payments globally
            </h2>
            <p className="mb-6 text-sm md:text-base font-medium">
              Ready for hassle-free, secure payments anywhere in the world?
              Start using Monks Pay today: it’s fast, free, and focused on
              keeping your transactions secure!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition">
                Download the App
              </button>
              <button className="border border-white text-white hover:bg-white hover:text-black font-semibold py-3 px-6 rounded-full transition">
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* /// testimonial */}
      <section className="bg-white py-16 px-4 md:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <p className="text-purple-600 uppercase font-semibold text-sm">
              Testimonial
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              We’ve build trust with <br /> reviews from real users
            </h2>
            <p className="text-gray-500 mb-6">
              Boost your credibility by featuring genuine testimonials from real
              users, showcasing their positive experiences and satisfaction with
              Monks Pay services.
            </p>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100">
                &lt;
              </button>
              <button className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100">
                &gt;
              </button>
            </div>
          </div>

          <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-white shadow rounded-xl p-6">
                <div className="flex text-yellow-400 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6">{t.text}</p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
