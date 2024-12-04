   // components/card.js

   const Card = ({ image, name, location, link, distance, difficulty, rating }) => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <img src={image} alt={name} className="w-full h-64 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600">{location}</p>
        <p className="text-gray-600">Jarak: {distance}</p>
        <p className="text-gray-600">Kesulitan: {difficulty}</p>
        <p className="text-gray-600">Peringkat: {rating}</p>
        <a href={link} className="text-blue-500 hover:text-blue-700">Lihat Detail</a>
      </div>
    </div>
  );

  export default Card;