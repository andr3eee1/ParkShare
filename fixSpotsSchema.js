const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const spotModel = `
model ParkingSpot {
  id          String   @id @default(uuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  name        String
  description String?
  latitude    Float
  longitude   Float
  price       Float
  isAvailable Boolean  @default(true)
  imageUrl    String?
  createdAt   DateTime @default(now())
}
`;

if (!content.includes('model ParkingSpot')) {
  content = content + '\n' + spotModel;
  
  content = content.replace(
    '  cards        CreditCard[]',
    '  cards        CreditCard[]\n  ownedSpots   ParkingSpot[]'
  );

  fs.writeFileSync('backend/prisma/schema.prisma', content);
}
