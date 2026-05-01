import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './products/schemas/product.schema';

const products = [
  {
    name: 'Calcium Plus Vitamin D3',
    category: 'Bone Health',
    description:
      'Advanced calcium supplement with Vitamin D3 for optimal bone density and strength.',
    tags: ['calcium', 'vitamin d', 'bone health', 'joint support', 'osteoporosis prevention'],
    price: 24.99,
    stock: 150,
    imageUrl:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',
    aiKeywords: [
      'bone',
      'calcium',
      'vitamin d3',
      'osteoporosis',
      'bone density',
      'fracture',
      'teeth',
      'muscle function',
    ],
  },
  {
    name: 'Vitamin D3 5000 IU',
    category: 'Vitamins',
    description:
      'Vitamin D3 supports bone health, immune function, and mood regulation. Ideal for those with limited sun exposure.',
    tags: ['vitamin d', 'bone health', 'immune', 'mood'],
    price: 14.99,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&h=300&fit=crop',
    aiKeywords: [
      'bone',
      'calcium absorption',
      'depression',
      'fatigue',
      'immune',
      'rickets',
      'osteoporosis',
      'sun deficiency',
      'vitamin d deficiency',
    ],
  },
  {
    name: 'Magnesium Glycinate 400mg',
    category: 'Minerals',
    description:
      'Highly bioavailable magnesium glycinate for muscle relaxation, sleep quality, and stress relief.',
    tags: ['magnesium', 'sleep', 'muscle', 'stress relief', 'relaxation'],
    price: 18.99,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300&h=300&fit=crop',
    aiKeywords: [
      'insomnia',
      'sleep',
      'muscle cramps',
      'anxiety',
      'stress',
      'headache',
      'migraine',
      'constipation',
      'magnesium deficiency',
    ],
  },
  {
    name: 'Omega-3 Fish Oil 1200mg',
    category: 'Supplements',
    description:
      'Premium fish oil rich in EPA and DHA to support heart health, brain function, and reduce inflammation.',
    tags: ['omega-3', 'fish oil', 'heart health', 'brain', 'anti-inflammatory'],
    price: 22.99,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&h=300&fit=crop',
    aiKeywords: [
      'heart',
      'cholesterol',
      'triglycerides',
      'brain',
      'memory',
      'inflammation',
      'joint pain',
      'depression',
      'cardiovascular',
    ],
  },
  {
    name: 'Probiotic 50 Billion CFU',
    category: 'Digestive Health',
    description:
      '10-strain probiotic formula to restore gut flora, improve digestion, and boost immune health.',
    tags: ['probiotic', 'gut health', 'digestion', 'immune', 'microbiome'],
    price: 29.99,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=300&fit=crop',
    aiKeywords: [
      'bloating',
      'diarrhea',
      'constipation',
      'IBS',
      'gut',
      'digestion',
      'immune',
      'yeast infection',
      'antibiotic recovery',
      'leaky gut',
    ],
  },
  {
    name: 'Calcium Plus Vitamin D3',
    category: 'Bone Health',
    description:
      'Advanced calcium supplement with Vitamin D3 for optimal bone density and strength.',
    tags: ['calcium', 'vitamin d3', 'bone health', 'bone density', 'minerals'],
    price: 24.99,
    stock: 150,
    imageUrl:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',
    aiKeywords: [
      'bone',
      'calcium',
      'vitamin d3',
      'osteoporosis',
      'bone density',
      'fracture',
      'teeth',
      'muscle function',
    ],
  },
  {
    name: 'Zinc Picolinate 50mg',
    category: 'Immunity',
    description:
      'Highly bioavailable zinc picolinate for immune function, wound healing, and skin health.',
    tags: ['zinc', 'immune', 'skin', 'wound healing', 'antioxidant'],
    price: 14.99,
    stock: 300,
    imageUrl:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',
    aiKeywords: [
      'immune',
      'cold',
      'acne',
      'skin',
      'wound',
      'hair loss',
      'zinc deficiency',
    ],
  },
  {
    name: 'Ashwagandha 600mg KSM-66',
    category: 'Herbal Supplements',
    description:
      'Clinically studied KSM-66 ashwagandha root extract to reduce cortisol, combat stress, and improve energy.',
    tags: ['ashwagandha', 'adaptogen', 'stress', 'cortisol', 'energy'],
    price: 24.99,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=300&h=300&fit=crop',
    aiKeywords: [
      'stress',
      'anxiety',
      'cortisol',
      'fatigue',
      'adrenal',
      'thyroid',
      'testosterone',
      'sleep',
      'burnout',
      'adaptogen',
    ],
  },
  {
    name: 'Iron Bisglycinate 25mg',
    category: 'Minerals',
    description:
      'Gentle, non-constipating iron bisglycinate to treat iron deficiency anemia and boost energy levels.',
    tags: ['iron', 'anemia', 'energy', 'blood', 'hemoglobin'],
    price: 13.99,
    stock: 110,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',
    aiKeywords: [
      'anemia',
      'fatigue',
      'iron deficiency',
      'pale skin',
      'shortness of breath',
      'hair loss',
      'weakness',
      'hemoglobin',
      'menstruation',
    ],
  },
  {
    name: 'B-Complex Vitamin',
    category: 'Vitamins',
    description:
      'Complete B-vitamin complex including B1, B2, B3, B5, B6, B7, B9, and B12 for energy metabolism and nerve health.',
    tags: ['b vitamins', 'energy', 'nerve health', 'metabolism', 'b12'],
    price: 16.99,
    stock: 95,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
    aiKeywords: [
      'fatigue',
      'energy',
      'nerve',
      'neuropathy',
      'depression',
      'brain fog',
      'metabolism',
      'b12 deficiency',
      'anemia',
      'stress',
    ],
  },
  {
    name: 'Turmeric Curcumin 1500mg',
    category: 'Herbal Supplements',
    description:
      'High-potency turmeric with BioPerine black pepper extract for maximum absorption and anti-inflammatory benefits.',
    tags: ['turmeric', 'curcumin', 'anti-inflammatory', 'joint health', 'antioxidant'],
    price: 19.99,
    stock: 85,
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop',
    aiKeywords: [
      'inflammation',
      'joint pain',
      'arthritis',
      'pain',
      'antioxidant',
      'gut',
      'liver',
      'brain',
      'cancer prevention',
      'curcumin',
    ],
  },
  {
    name: 'Collagen Peptides Powder',
    category: 'Supplements',
    description:
      'Hydrolyzed collagen peptides to support skin elasticity, joint health, and hair and nail strength.',
    tags: ['collagen', 'skin', 'joints', 'hair', 'nails', 'anti-aging'],
    price: 34.99,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
    aiKeywords: [
      'skin',
      'wrinkles',
      'aging',
      'joint pain',
      'hair loss',
      'nails',
      'gut lining',
      'leaky gut',
      'collagen deficiency',
    ],
  },
  {
    name: 'Melatonin 5mg',
    category: 'Sleep Support',
    description:
      'Fast-dissolve melatonin tablets to regulate sleep cycles, reduce jet lag, and improve sleep onset.',
    tags: ['melatonin', 'sleep', 'insomnia', 'jet lag', 'circadian rhythm'],
    price: 9.99,
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=300&h=300&fit=crop',
    aiKeywords: [
      'insomnia',
      'sleep',
      'jet lag',
      'night shift',
      'circadian',
      'sleep disorder',
      'anxiety',
      'restless',
      'waking up at night',
    ],
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));

  console.log('🌱 Seeding database...');

  // Clear existing products
  await productModel.deleteMany({});
  console.log('🗑️  Cleared existing products');

  // Insert new products
  const inserted = await productModel.insertMany(products);
  console.log(`✅ Inserted ${inserted.length} products`);

  await app.close();
  console.log('🎉 Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
