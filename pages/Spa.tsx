import React from 'react';
import { Check } from 'lucide-react';

export const Spa: React.FC = () => {
  const packages = [
    {
      id: 1,
      name: "Princess Basic",
      price: 200,
      features: ["Manicure", "Pedicure", "Juice Box", "Hot Dog"]
    },
    {
      id: 2,
      name: "Princess Glow",
      price: 250,
      features: ["Manicure & Massage", "Pedicure", "Mini Facial", "Catering Included"]
    },
    {
      id: 3,
      name: "Royal Treatment",
      price: 350,
      features: ["Full Mani-Pedi", "Massage", "Facial", "Make-up", "Premium Catering"]
    },
    {
      id: 4,
      name: "Besties Party (Group of 4)",
      price: 1000,
      features: ["Group Mani-Pedis", "Group Photo", "Full Catering", "Gift Bags"]
    }
  ];

  const handleBook = (pkgName: string) => {
     // For Spa, since it requires date scheduling, we'll direct to WhatsApp or Contact for now.
     // In a full app, this would go to a calendar/booking page.
     const message = `Hi, I would like to book the ${pkgName} package.`;
     const whatsappUrl = `https://wa.me/27793057899?text=${encodeURIComponent(message)}`;
     window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-pink-600 font-bold tracking-widest uppercase">For the little ones</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mt-2 mb-6">Kids Spa Packages</h1>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg">
            Create magical memories with our specialized spa parties. 
            Located at 108-109 Kubeka Street, Vosloorus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packages.map((pkg, index) => (
            <div key={pkg.id} className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden ${index === 1 ? 'border-2 border-pink-400 transform md:-translate-y-4' : ''}`}>
               {index === 1 && (
                <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-bold text-pink-600">R{pkg.price}</span>
                <span className="text-gray-500 ml-1">/child</span>
              </div>
              <ul className="space-y-4 mb-8">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600 text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleBook(pkg.name)} className="w-full py-3 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800 transition shadow-lg">
                Book Now (WhatsApp)
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-20 flex flex-col md:flex-row items-center bg-white rounded-2xl overflow-hidden shadow-xl">
            <div className="md:w-1/2 h-64 md:h-auto">
                <img src="https://picsum.photos/800/600?random=2" alt="Kids Spa" className="w-full h-full object-cover" />
            </div>
            <div className="md:w-1/2 p-10">
                <h3 className="text-2xl font-serif font-bold mb-4">What's Included?</h3>
                <p className="text-gray-600 mb-4">Every party is handled with love and care by our professional staff. We ensure a safe, fun, and hygienic environment for all children.</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="font-medium">Drinks & Hot Dogs</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="font-medium">Safe Cosmetics</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="font-medium">Relaxing Music</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="font-medium">Bathrobes provided</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};