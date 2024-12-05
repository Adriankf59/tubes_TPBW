import Head from 'next/head';
import { useState, useEffect } from 'react';
import Card from '../Card';
import Footer from '../Footer';

export default function Home({ mountains }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMountains, setFilteredMountains] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("All");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleNext = () => {
    const nextIndex = currentIndex + 4;
    if (nextIndex < getCurrentMountains().length) {
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentIndex - 4;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    if (value) {
      const filtered = mountains.filter((mountain) =>
        mountain.name.toLowerCase().includes(value)
      );
      setFilteredMountains(filtered);
    } else {
      setFilteredMountains([]);
    }
  };

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
    setCurrentIndex(0);  // Reset index when province changes
  };

  const getCurrentMountains = () => {
    let currentMountains = mountains;

    if (selectedProvince !== "All") {
      currentMountains = mountains.filter(
        (mountain) => mountain.provinsi === selectedProvince
      );
    }
    
    if (filteredMountains.length > 0) {
      currentMountains = currentMountains.filter((mountain) =>
        filteredMountains.includes(mountain)
      );
    }

    return currentMountains;
  };

  const uniqueProvinces = ["All", ...new Set(mountains.map(mountain => mountain.provinsi))];

  return (
    <>
      <Head>
        <title>BandungTrail</title>
      </Head>
      <main>
        <section className="relative bg-cover bg-center h-screen top-0">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/images/gunung.mov"
            autoPlay
            loop
            muted
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Ready to do this?
            </h1>
            <div className="w-full max-w-lg relative">
              <input
                type="text"
                placeholder="Search by city, park, or trail name"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full p-4 rounded-full shadow text-gray-800"
              />
              {searchTerm && filteredMountains.length > 0 && (
                <ul className="absolute left-0 right-0 bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-auto z-10">
                  {filteredMountains.map((mountain) => (
                    <li key={mountain.id} className="p-2 cursor-pointer hover:bg-gray-200">
                      <a href={`/mountains/${mountain.id}`} className="text-gray-800 block">
                        {mountain.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
        <section className="py-8 bg-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-4">
              All mountain routes at <span className="text-green-600">Indonesia</span>
            </h2>
            <div className="mb-4">
              <label htmlFor="province" className="block text-lg font-medium text-gray-700">
                Select Province:
              </label>
              <select
                id="province"
                name="province"
                value={selectedProvince}
                onChange={handleProvinceChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {uniqueProvinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between relative">
              {isClient && currentIndex > 0 && (
                <button
                  className="bg-gray-800 text-white p-4 rounded-full shadow-md hover:bg-gray-700 transition duration-300"
                  onClick={handlePrev}
                  style={{ zIndex: 50 }}
                >
                  &lt;
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-grow mx-4">
                {isClient &&
                  getCurrentMountains().slice(currentIndex, currentIndex + 4).map((mountain) => (
                    <Card
                      key={mountain.id}
                      image={`http://localhost:8055/assets/${mountain.image}`}
                      name={mountain.name}
                      location={mountain.location}
                      link={`/mountains/${mountain.id}`}
                      distance={`${mountain.distance} km`}
                      difficulty={mountain.difficulty}
                      rating={mountain.rating}
                    />
                  ))}
              </div>
              {isClient && currentIndex + 4 < getCurrentMountains().length && (
                <button
                  className="bg-gray-800 text-white p-4 rounded-full shadow-md hover:bg-gray-700 transition duration-300"
                  onClick={handleNext}
                  style={{ zIndex: 50 }}
                >
                  &gt;
                </button>
              )}
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}

export async function getStaticProps() {
  const res = await fetch('http://127.0.0.1:8055/items/mountains');
  const jsonData = await res.json();

  const mountains = jsonData.data;

  return {
    props: {
      mountains,
    },
    revalidate: 10, // Re-generate the page at most once every 10 seconds
  };
}