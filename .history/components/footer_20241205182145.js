import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-4 flex flex-wrap justify-between">
        {/* Subscription Section */}
        <div className="w-full md:w-1/3 mb-8 md:mb-0">
          <h2 className="text-xl font-semibold mb-4">
            Join 16,000+ people who get our web marketing tips twice a month
          </h2>
          <form className="flex">
            <input
              type="email"
              placeholder="Email Address"
              className="w-2/3 p-3 rounded-l-full focus:outline-none"
            />
            <button
              type="submit"
              className="w-1/3 p-3 bg-red-600 text-white rounded-r-full hover:bg-red-700"
            >
              Sign me up
            </button>
          </form>
          <p className="text-sm mt-2">
            By signing up you agree to our <a href="#" className="text-blue-300">Privacy Policy.</a>
          </p>
          <div className="mt-4 flex space-x-4">
            <a href="#"><i className="fab fa-facebook-f text-white"></i></a>
            <a href="#"><i className="fab fa-twitter text-white"></i></a>
            <a href="#"><i className="fab fa-linkedin-in text-white"></i></a>
            <a href="#"><i className="fab fa-youtube text-white"></i></a>
          </div>
        </div>
        {/* Certification Section */}
        <div className="w-full md:w-1/3 mb-8 md:mb-0">
          <div className="flex items-center mb-4">
            <img src="https://via.placeholder.com/50" alt="Certification Logo" className="mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Certified B Corporation</h3>
            </div>
          </div>
          <p>
            We strive to educate and collaborate with like-minded businesses to make a difference
            environmentally and socially. Together we can make an impact.
          </p>
          <a href="#" className="text-red-600 hover:underline">Learn About Our BCorp Values</a>
        </div>
        {/* Contact Section */}
        <div className="w-full md:w-1/3">
          <h3 className="text-lg font-semibold mb-4">Come Say Hello!</h3>
          <p>
            4043 N Ravenswood Ave
            <br />
            Suite 316
            <br />
            Chicago, IL, 60613
          </p>
          <p className="text-red-500 font-semibold my-2">(773) 348-4581</p>
          <button className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700">
            Contact
          </button>
        </div>
      </div>
      <div className="container mx-auto px-4 text-center pt-8 border-t border-gray-700">
        <ul className="flex justify-center space-x-4 text-sm">
          <li><a href="#" className="hover:underline">Privacy Policy</a></li>
          <li><a href="#" className="hover:underline">Sitemap</a></li>
          <li>Support</li>
          <li>© 2020 Orbit Media Studios</li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;