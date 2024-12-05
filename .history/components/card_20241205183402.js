import Link from 'next/link';

const Card = ({ image, name, location, link, distance, difficulty, rating }) => (
  <Link href={link} passHref>
    <div className="transform transition-transform duration-200 ease-in-out hover:scale-105 cursor-pointer bg-white shadow-md rounded-lg overflow-hidden">
      <img src={image} alt={name} className="w-full h-64 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600">{location}</p>
        <p className="text-gray-600">Distance: {distance}</p>
        <p className="text-gray-600">Difficulty: {difficulty}</p>
        <p className="text-gray-600">Rating: {rating}</p>
        <span className="text-blue-500 hover:text-blue-700">
          View Details
        </span>
      </div>
    </div>
  </Link>
);

export default Card;