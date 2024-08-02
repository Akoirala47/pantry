## Inventory Management App

This React project is a Web-application for managing inventory. Users can log in with Google and view, edit, and add items to their inventory. They can also import their inventory from a CSV file.

### Features

* User authentication with Google Firebase
* Real-time inventory data management with Firestore
* CRUD operations for inventory items (Create, Read, Update, Delete)
* Search functionality for filtering inventory items
* Inventory overview with total items, low stock, and out of stock counts
* CSV import for bulk adding inventory items
* Animations with Framer Motion

### Technologies Used

* React
* Next.js (for routing)
* Firebase (authentication and Firestore)
* Framer Motion (for animations)
* CSV parsing library (for parsing CSV data)

### Project Structure

```
.
├── components
│   ├── LoginForm.jsx
│   ├── Navbar.jsx
│   └── ... (other components)
├── firebase.js
├── pages
│   ├── _app.js
│   ├── edit-inventory.jsx  # Edit inventory page
│   └── index.jsx           # Dashboard page
│   └── ... (other pages)
├── public
│   ├── assets
│   │   └── food-icons-collage.png  # Login background image
│   └── ... (other public assets)
├── utils.js                 # Utility functions
└── README.md                # This file
```

### Running the Project

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a Firebase project and configure it with the app (follow Firebase documentation).
4. Set up your Firebase configuration in `firebase.js`.
5. Run the development server: `npm run dev`

### Usage

1. Login with Google.
2. You can then view, edit, add, and delete items in your inventory.
3. You can also import your inventory from a CSV file.


## Sample Data for Inventory Management App

**You can use this sample data set to upload onto the inventory management app.**

The data is formatted as a CSV with the following columns:

* **name**: The name of the item.
* **count**: The quantity of the item.
* **expirationDate**: The expiration date of the item in DD-MM-YYYY format.


### Data Sample

```
name,count,expirationDate
Bread - Ciabatta Buns,1,27-01-2025
Mushrooms - Honey,18,15-07-2024
Wine - Sicilia Igt Nero Avola,7,25-10-2024
Bonito Flakes - Toku Katsuo,2,14-07-2024
Hand Towel,15,25-11-2024
Juice - Lime,12,24-11-2024
Shrimp - Black Tiger 26/30,5,26-07-2024
Bread - French Baquette,4,27-07-2024
Chickhen - Chicken Phyllo,16,06-01-2025
Placemat - Scallop, White,18,21-10-2024
Canada Dry,14,12-08-2024
Sugar - Splenda Sweetener,9,30-01-2025
Pork - Bacon, Sliced,4,29-10-2024
Chambord Royal,4,10-03-2025
Eggwhite Frozen,11,20-07-2024
Veal - Ground,17,28-10-2024
Aspic - Clear,13,12-03-2025
Lemonade - Black Cherry, 591 Ml,14,11-08-2024
Wine - Sauvignon Blanc Oyster,10,14-09-2024
Breakfast Quesadillas,19,02-03-2025
Sherbet - Raspberry,1,09-10-2024
Crackers - Melba Toast,18,23-11-2024
Trout - Hot Smkd, Dbl Fillet,13,19-02-2025
Cabbage - Green,3,01-03-2025
Pork - Butt, Boneless,14,13-11-2024
Wine - Balbach Riverside,19,11-08-2024
Grouper - Fresh,12,20-02-2025
Cheese - Roquefort Pappillon,9,17-01-2025
Beef - Top Butt,14,16-12-2024
Pear - Asian,8,12-08-2024
Coffee Decaf Colombian,16,31-01-2025
Puree - Kiwi,6,10-12-2024
Capers - Ox Eye Daisy,6,17-01-2025
Garlic - Elephant,3,12-07-2024
Lemonade - Natural, 591 Ml,20,10-03-2025
Aromat Spice Seasoning,7,24-10-2024
Rum - Spiced, Captain Morgan,19,08-03-2025
Soup Campbells,8,31-12-2024
Peas Snow,5,22-09-2024
Chocolate - Milk,16,02-07-2024
Cabbage - Red,11,06-07-2024
Soup - Campbells, Creamy,17,02-03-2025
Mustard Prepared,10,08-03-2025
Wine - Magnotta - Cab Sauv,6,25-08-2024
Creme De Banane - Marie,10,07-10-2024
Pie Shell - 9,7,13-02-2025
Water - Green Tea Refresher,6,05-02-2025
Tart Shells - Savory, 4,4,21-07-2024
Table Cloth - 53x69 Colour,17,23-12-2024
Beer - Sleemans Honey Brown,6,01-10-2024
Dried Apple,19,30-12-2024
Carbonated Water - Orange,11,08-11-2024
Tea - Jasmin Green,6,17-02-2025
Foil - 4oz Custard Cup,5,20-12-2024
Hummus - Spread,3,10-02-2025
Beans - Yellow,11,13-09-2024
Bread - Pullman, Sliced,19,08-01-2025
Beer - Upper Canada Lager,9,13-01-2025
Beer - Sleeman Fine Porter,6,23-07-2024
Chinese Foods - Chicken Wing,14,23-02-2025
Scallops - In Shell,14,14-08-2024
Pasta - Linguini, Dry,4,28-02-2025
Beef - Tender Tips,1,28-08-2024
Pepper - Pablano,19,27-02-2025
Crab - Soft Shell,16,25-11-2024
Pork - Loin, Bone - In,9,04-11-2024
Compound - Rum,0,04-01-2025
Flour - Bran, Red,9,29-11-2024
```

You can copy and paste this data into the CSV input and use it to upload your initial inventory.
