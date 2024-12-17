import React from "react";
import Image from 'next/image';
import Link from 'next/link';

const Card = ({ image, name, kota, provinsi, link, elevation }) => {
  return (
    <Link href={link} passHref>
      <div className="block text-inherit w-full h-full transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg rounded-lg overflow-hidden">
        <div className="flex flex-col bg-white shadow-md h-full">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {/* Menggunakan Image dari next/image untuk optimasi gambar */}
            <Image
              src={image}
              alt={`Image of ${name}`}
              layout="fill"
              objectFit="cover"
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="text-lg font-semibold text-black">{name}</h3>
            <p className="mt-2 text-gray-600 truncate">{kota}, {provinsi}</p>
            <p className="mt-4 text-sm text-gray-600">Elevation : {elevation} m</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Card;