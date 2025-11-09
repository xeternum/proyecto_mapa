// js/mockData.js
export const mockUsers = [
    {
        id: 1,
        serviceName: "Plomería de Emergencia 24/7",
        description: "Servicio profesional de plomería con atención las 24 horas. Reparamos tuberías, instalamos grifos y solucionamos emergencias.",
        price: 25000,
        priceModality: "por_servicio",
        schedule: "24 horas",
        address: "Av. Siempre Viva 123, Santiago",
        category: "Gasfíter",
        rating: 4.8,
        location: { lat: -33.45, lng: -70.66 },
        contactMethod: {
            method: "phone",
            phone: "912345678",
            countryCode: "+56",
            whatsappAvailable: true
        }
    },
    {
        id: 2,
        serviceName: "Desarrollo de Sitios Web",
        description: "Creación de sitios web modernos y responsivos. Especializado en e-commerce, landing pages y aplicaciones web.",
        price: 200000,
        priceModality: "por_proyecto",
        schedule: "Lunes a Viernes",
        address: "Calle Falsa 456, Providencia",
        category: "Programador web",
        rating: 4.5,
        location: { lat: -33.43, lng: -70.61 },
        contactMethod: {
            method: "email",
            email: "ana.gomez@webdev.cl"
        }
    },
    {
        id: 3,
        serviceName: "Cuidado de Niños Especializado",
        description: "Servicio de niñera profesional con experiencia en cuidado infantil. Referencias verificables y primeros auxilios.",
        price: 8000,
        priceModality: "por_hora",
        schedule: "Lunes a Sábado",
        address: "Pasaje Corto 789, Ñuñoa",
        category: "Niñera",
        rating: 4.7,
        location: { lat: -33.46, lng: -70.60 },
        contactMethod: {
            method: "phone",
            phone: "987654321",
            countryCode: "+56",
            whatsappAvailable: false
        }
    },
    {
        id: 4,
        serviceName: "Muebles de Madera a Medida",
        description: "Fabricación artesanal de muebles en madera maciza. Diseños únicos y personalizados para tu hogar.",
        price: 150000,
        priceModality: "por_proyecto",
        schedule: "Lunes a Viernes",
        address: "Av. Larga 101, Las Condes",
        category: "Carpintero",
        rating: 4.6,
        location: { lat: -33.41, lng: -70.58 },
        contactMethod: {
            method: "email",
            email: "beatriz.luna@carpinteria.com"
        }
    },
    {
        id: 5,
        serviceName: "Instalaciones Eléctricas Certificadas",
        description: "Instalaciones eléctricas residenciales y comerciales. Trabajos certificados con garantía de calidad y SEC.",
        price: 30000,
        priceModality: "por_servicio",
        schedule: "Lunes a Sábado",
        address: "Jirón del Medio 212, Maipú",
        category: "Electricista",
        rating: 4.4,
        location: { lat: -33.51, lng: -70.77 },
        contactMethod: {
            method: "phone",
            phone: "911223344",
            countryCode: "+56",
            whatsappAvailable: true
        }
    },
    {
        id: 6,
        serviceName: "Corte y Peinado Profesional",
        description: "Servicio de peluquería a domicilio. Cortes modernos, tratamientos capilares y peinados para eventos especiales.",
        price: 15000,
        priceModality: "por_servicio",
        schedule: "Lunes a Domingo",
        address: "Av. Providencia 1234, Providencia",
        category: "Peluquero",
        rating: 4.9,
        location: { lat: -33.42, lng: -70.62 },
        contactMethod: {
            method: "phone",
            phone: "922334455",
            countryCode: "+56",
            whatsappAvailable: true
        }
    },
    {
        id: 7,
        serviceName: "Reparación de Computadores",
        description: "Diagnóstico y reparación de equipos de escritorio y laptops. Instalación de software y recuperación de datos.",
        price: 20000,
        priceModality: "por_servicio",
        schedule: "Lunes a Viernes",
        address: "San Diego 890, Santiago Centro",
        category: "Técnico en computación",
        rating: 4.3,
        location: { lat: -33.44, lng: -70.65 },
        contactMethod: {
            method: "email",
            email: "tech.support@reparaciones.com"
        }
    },
    {
        id: 8,
        serviceName: "Mudanzas y Traslados",
        description: "Servicio completo de mudanzas residenciales y comerciales. Embalaje, transporte y montaje incluido.",
        price: 80000,
        priceModality: "por_servicio",
        schedule: "Lunes a Sábado",
        address: "Maipú 567, Maipú",
        category: "Servicio de mudanza",
        rating: 4.2,
        location: { lat: -33.52, lng: -70.75 },
        contactMethod: {
            method: "phone",
            phone: "944556677",
            countryCode: "+56",
            whatsappAvailable: false
        }
    }
];
