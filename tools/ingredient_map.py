"""Maps every recipe ingredient line to specific pantry items (or a sub-recipe).
Output: web/ingredients.json = {"items": {name: [location, category, unit]}, "map": {raw_lower: {"items": [...], "sub": [...], "skip": bool}}, "rules": [[regex, result], ...]}
The app uses "map" for known lines and "rules" (same rules, in order) for new ones.
"""
import json, re, sys

# ---------- pantry catalog: name -> (location, category, unit) ----------
C = {}
def cat(loc, category, unit, *names):
    for n in names: C[n] = (loc, category, unit)

cat('spices', 'Spices', 'jar', 'Kosher salt', 'Table salt', 'Sea salt', 'Pickling salt', 'Black pepper', 'Black peppercorns', 'White pepper', 'Garlic powder', 'Onion powder',
    'Paprika', 'Smoked paprika', 'Cayenne pepper', 'Chili powder', 'Ground cumin', 'Dried oregano', 'Dried thyme', 'Dried basil', 'Dried rosemary', 'Rubbed sage', 'Bay leaves',
    'Red pepper flakes', 'Italian seasoning', 'Cajun seasoning', 'Old Bay seasoning', 'Poultry seasoning', 'Ground cinnamon', 'Cinnamon sticks', 'Ground nutmeg', 'Ground ginger',
    'Ground cloves', 'Ground allspice', 'Ground coriander', 'Ground turmeric', 'Dry mustard', 'Mustard seed', 'Celery seed', 'Dill seed', 'Dried dill', 'Dried parsley',
    'Curry powder', 'Taco seasoning', 'Seasoned salt', 'Lemon pepper', 'Aleppo pepper', 'Urfa pepper', 'Sumac', "Za'atar", 'Filé powder', 'Malt vinegar powder', 'Burger seasoning', 'Sesame seeds', 'Ranch seasoning')
cat('fridge', 'Dairy & Eggs', 'each', 'Eggs')
cat('fridge', 'Dairy & Eggs', 'gal', 'Whole milk')
cat('fridge', 'Dairy & Eggs', 'stick', 'Butter', 'Margarine')
cat('fridge', 'Dairy & Eggs', 'qt', 'Buttermilk', 'Half-and-half', 'Heavy cream')
cat('fridge', 'Dairy & Eggs', 'tub', 'Sour cream', 'Greek yogurt', 'Labneh')
cat('fridge', 'Dairy & Eggs', 'block', 'Cream cheese', 'Velveeta')
cat('fridge', 'Dairy & Eggs', 'bag', 'Shredded cheddar cheese', 'White cheddar cheese', 'Shredded mozzarella', 'Monterey Jack cheese', 'Pepper Jack cheese', 'Gruyère cheese',
    'Swiss cheese', 'Provolone cheese', 'Blue cheese crumbles', 'Cotija cheese', 'Parmesan cheese')
cat('fridge', 'Dairy & Eggs', 'pack', 'Sliced American cheese', 'White American cheese')
cat('fridge', 'Meat & Seafood', 'lb', 'Bacon', 'Ground beef', 'Ground pork', 'Ground venison', 'Breakfast sausage', 'Italian sausage', 'Andouille sausage', 'Chicken breasts',
    'Chicken thighs', 'Whole chicken', 'Chicken livers', 'Rotisserie chicken', 'Cube steak', 'Ribeye steak', 'Flank steak', 'Beef chuck roast', 'Pork shoulder', 'Pork chops',
    'Pork tenderloin', 'Pork ribs', 'Spiral ham', 'Country ham', 'Bologna', 'Smoked ham hock', 'Smoked turkey wings', 'Whole turkey', 'Turkey thighs', 'Sliced turkey',
    'Cooked turkey', 'Duck breasts', 'Frog legs', 'Catfish fillets', 'Salmon fillets', 'Crab meat', 'Crawfish tails', 'Shrimp', 'Oysters')
cat('fridge', 'Pantry', 'jar', 'Mayonnaise', 'Yellow mustard', 'Dijon mustard', 'Creole mustard', 'Stone-ground mustard', 'Ketchup', 'Dill pickles', 'Dill pickle relish',
    'Sweet pickle relish', 'Pickled jalapeños', 'Prepared horseradish', 'Capers', 'Anchovy paste', 'Salsa', 'Italian dressing', 'Ranch dressing', 'Tartar sauce',
    'Thousand Island dressing', 'Blue cheese dressing', 'Maraschino cherries', 'Cherry jam', 'Panang curry paste', 'Bacon grease', 'Pecan butter', 'Guacamole')
cat('fridge', 'Bakery', 'pack', 'Corn tortillas', 'Flour tortillas', 'Wonton wrappers', 'Refrigerated pie crust')
cat('freezer', 'Frozen', 'bag', 'Frozen peas', 'Frozen corn', 'Frozen peas and carrots', 'Frozen broccoli', 'Frozen hash browns', 'Frozen french fries', 'Frozen pie crusts',
    'Frozen purple hull peas', 'Frozen green beans', 'Frozen butter beans', 'Whipped topping', 'Vanilla ice cream', 'Frozen strawberries')
cat('counter', 'Produce', 'each', 'Yellow onions', 'Sweet onions', 'Red onions', 'White onions', 'Garlic', 'Russet potatoes', 'Yukon Gold potatoes', 'Baby potatoes',
    'Sweet potatoes', 'Tomatoes', 'Green tomatoes', 'Bananas', 'Apples', 'Lemons', 'Limes', 'Oranges', 'Avocados', 'Pineapple', 'Peaches', 'Figs')
cat('fridge', 'Produce', 'each', 'Green onions', 'Celery', 'Carrots', 'Green bell peppers', 'Red bell peppers', 'Orange bell peppers', 'Jalapeños', 'Hatch green chiles', 'Hot peppers', 'Lettuce',
    'Green cabbage', 'Coleslaw mix', 'Cucumbers', 'Spinach', 'Collard greens', 'Turnip greens', 'Turnips', 'Okra', 'Zucchini', 'Yellow squash', 'Mushrooms', 'Broccoli', 'Sweet corn',
    'Green beans', 'Strawberries', 'Blackberries', 'Fresh cranberries', 'Cherries', 'Fresh parsley', 'Cilantro', 'Fresh basil', 'Fresh thyme', 'Fresh sage', 'Fresh rosemary',
    'Fresh dill', 'Chives', 'Fresh mint', 'Fresh ginger', 'Makrut lime leaves', 'Magnolia blossoms', 'Pico de gallo')
cat('pantry', 'Pantry', 'bag', 'Long-grain white rice', 'Jasmine rice', 'Spaghetti', 'Elbow macaroni', 'Egg noodles', 'Fettuccine', 'Grits', 'Old-fashioned oats',
    'Dried pinto beans', 'Dried kidney beans', 'Dried black-eyed peas', 'Corn husks', 'Raisins', 'Dried peaches', 'Pecans', 'Raw peanuts')
cat('pantry', 'Pantry', 'can', 'Diced tomatoes', 'Rotel', 'Crushed tomatoes', 'Whole peeled tomatoes', 'Tomato sauce', 'Tomato paste', 'Sun-dried tomatoes', 'Chicken broth',
    'Beef broth', 'Turkey stock', 'Vegetable broth', 'Seafood stock', 'Black beans', 'Pinto beans', 'Kidney beans', 'Refried beans', 'Cream of chicken soup',
    'Cream of mushroom soup', 'Coconut milk', 'Green enchilada sauce', 'Pumpkin purée', 'French fried onions', 'Water chestnuts', 'Baby corn', 'Canned corn',
    'Cream-style corn', 'Diced green chiles', 'Diced pimentos', 'Canned pineapple', 'Mandarin oranges', 'Black olives', 'Canned black-eyed peas', 'Pork and beans', 'Canned beets', 'Canned chicken', 'Canned salmon', 'Spam', 'Marinara sauce')
cat('pantry', 'Pantry', 'bottle', 'Peanut butter', 'Honey', 'Molasses', 'Maple syrup', 'Vegetable oil', 'Peanut oil', 'Olive oil', 'Toasted sesame oil', 'White vinegar',
    'Apple cider vinegar', 'Balsamic vinegar', 'Rice vinegar', 'Soy sauce', 'Fish sauce', 'Worcestershire sauce', 'Hot sauce', 'Barbecue sauce')
cat('pantry', 'Snacks', 'box', 'Croutons', 'Saltine crackers', 'Ritz crackers', 'Tortilla chips', 'Pretzels', 'Vanilla wafers', 'Crisp rice cereal', 'Taco shells')
cat('pantry', 'Bakery', 'loaf', 'White sandwich bread', 'Sourdough bread', 'Rye bread', 'Texas toast', 'Hamburger buns', 'Brioche buns', 'Hoagie rolls', 'Pita bread')
cat('pantry', 'Drinks', 'bag', 'Coffee', 'Espresso', 'Tea bags')
cat('pantry', 'Drinks', 'bottle', 'Dry white wine', 'Red wine', 'Beer', 'Banana liqueur', 'Cherry liqueur', 'Elderflower liqueur', 'Coconut rum', 'Spiced rum', 'Tequila',
    'Apple juice', 'Orange juice', 'Pineapple juice')
cat('baking', 'Baking', 'bag', 'All-purpose flour', 'Self-rising flour', 'Masa harina', 'Yellow cornmeal', 'Granulated sugar', 'Light brown sugar', 'Powdered sugar', 'Palm sugar',
    'Cornstarch', 'Bisquick', 'Jiffy corn muffin mix', 'Semisweet chocolate chips', 'Butterscotch chips', 'Chocolate bar', 'Sweetened flaked coconut', 'Mini marshmallows',
    'Marshmallow creme', 'Buttermilk powder', 'Panko breadcrumbs')
cat('baking', 'Baking', 'box', 'Baking powder', 'Baking soda', 'Cocoa powder', 'Instant vanilla pudding', 'Instant chocolate pudding', 'Strawberry gelatin', 'Shortening',
    'Active dry yeast', 'Instant yeast')
cat('baking', 'Baking', 'can', 'Evaporated milk', 'Sweetened condensed milk')
cat('baking', 'Baking', 'bottle', 'Vanilla extract', 'Almond extract', 'Light corn syrup', 'Red food coloring')
cat('household', 'Household', 'box', 'Toothpicks')

SUBS = ['Arkansas Barbecue Sauce', 'Arkansas BBQ Coleslaw', 'Arkansas Cajun Seasoning Blend', 'BBQ Dry Rub', 'Burger Seasoning Blend', 'Classic Yellow Cheese Dip',
        'Cathead Biscuits', 'Homemade Country Gravy', 'Mashed Potatoes', 'Skillet Cornbread', 'Cornbread Dressing', 'Homemade Thousand Island Dressing', 'Special Sauce', 'Tartar Sauce']

# ---------- rules: first match wins. result = "Item + Item + sub:Recipe" or "skip" ----------
R = [
 # whole-line oddities and multi-item garnish lines
 (r"^okay, it's one zucchini", "Zucchini + Yellow squash + Red bell peppers + Mushrooms + Garlic powder + Onion powder + Paprika + Black pepper + Table salt + Italian seasoning + Cayenne pepper + White pepper"),
 (r"avocado, cotija, cilantro, lime", "Avocados + Cotija cheese + Cilantro + Limes + Red onions"),
 (r"pico de gallo, jalape.os, sour cream, shredded lettuce, black olives", "Pico de gallo + Pickled jalapeños + Sour cream + Lettuce + Black olives"),
 (r"pico de gallo, pickled jalape.os, sour cream, guacamole, cilantro", "Pico de gallo + Pickled jalapeños + Sour cream + Guacamole + Cilantro"),
 (r"shredded lettuce, cheddar, diced tomato, onion, sour cream, salsa", "Lettuce + Shredded cheddar cheese + Tomatoes + Yellow onions + Sour cream + Salsa"),
 (r"butter, sour cream, cheddar, bacon", "Butter + Sour cream + Shredded cheddar cheese + Bacon + Chives"),
 (r"lettuce, tomato, onion, pickles", "Lettuce + Tomatoes + Yellow onions + Dill pickles"),
 (r"lettuce, tomato, red onion", "Lettuce + Tomatoes + Red onions"),
 (r"lemon wedges, tartar sauce, hushpuppies and coleslaw", "Lemons + sub:Tartar Sauce + sub:Arkansas BBQ Coleslaw"),
 (r"lemon wedges and tartar sauce", "Lemons + sub:Tartar Sauce"),
 (r"buns, arkansas bbq coleslaw and pickles", "Hamburger buns + sub:Arkansas BBQ Coleslaw + Dill pickles"),
 (r"buns and arkansas bbq coleslaw", "Hamburger buns + sub:Arkansas BBQ Coleslaw"),
 (r"buns and toppings", "Hamburger buns + Lettuce + Tomatoes + Dill pickles"),
 (r"bread cubes and tortilla chips", "White sandwich bread + Tortilla chips"),
 (r"dill pickle chips and mayonnaise", "Dill pickles + Mayonnaise"),
 (r"special sauce or ketchup and mustard", "sub:Special Sauce + Ketchup + Yellow mustard"),
 (r"yellow mustard, onion slices", "Yellow mustard + Yellow onions"),
 (r"green onions, parsley and fil", "Green onions + Fresh parsley + Filé powder"),
 (r"cooked white rice and green onions", "Long-grain white rice + Green onions"),
 (r"hot sauce and green onions", "Hot sauce + Green onions"),
 (r"cilantro and scallions", "Cilantro + Green onions"),
 (r"parsley and green onion", "Fresh parsley + Green onions"),
 (r"lemon slices and parsley", "Lemons + Fresh parsley"),
 (r"lemon slices and mint", "Lemons + Fresh mint"),
 (r"maple syrup and powdered sugar", "Maple syrup + Powdered sugar"),
 (r"fresh thyme, sage and rosemary", "Fresh thyme + Fresh sage + Fresh rosemary"),
 (r"cinnamon and nutmeg", "Ground cinnamon + Ground nutmeg"),
 (r"fine sea salt and black pepper", "Sea salt + Black pepper"),
 (r"^salt and (black )?pepper", "Table salt + Black pepper"),
 (r"burger seasoning blend \(or salt and pepper\)", "sub:Burger Seasoning Blend"),
 (r"brioche buns, buttered", "Brioche buns + Butter"),
 (r"butter beans|lima beans", "Frozen butter beans"),
 (r"string beans|snap beans|haricots? verts", "Green beans"),
 (r"\byams?\b", "Sweet potatoes"),
 (r"yellow potatoes|gold potatoes", "Yukon Gold potatoes"),
 (r"red potatoes", "Baby potatoes"),
 (r"orange (bell )?peppers?|yellow (bell )?peppers?", "Orange bell peppers"),
 (r"navel oranges?|^oranges?$|clementines?|mandarins? \(fresh\)", "Oranges"),
 (r"broccoli crowns?", "Broccoli"),
 (r"romaine|iceberg", "Lettuce"),
 (r"ranch seasoning", "Ranch seasoning"),
 (r"blue cheese dressing", "Blue cheese dressing"),
 (r"\(15 oz\) black-eyed peas|canned black-eyed", "Canned black-eyed peas"),
 (r"pork and beans|baked beans", "Pork and beans"),
 (r"beets", "Canned beets"),
 (r"cucumber", "Cucumbers"),
 (r"croutons", "Croutons"),
 (r"sunflower seeds or chopped pecans", "Pecans"),
 (r"^american cheese or velveeta", "Sliced American cheese"),
 (r"^(whole )?milk or ", "Whole milk"),
 (r"pineapple juice with a squeeze of lime", "Pineapple juice + Limes"),
 (r"cherry jam", "Cherry jam"),
 (r"green onions and sesame seeds", "Green onions + Sesame seeds"),
 (r"^oil or bacon grease", "Vegetable oil"),
 (r"heavy cream, whipped with .* sugar", "Heavy cream + Granulated sugar"),
 (r"hash browns", "Frozen hash browns"),
 (r"^water or chicken broth", "Chicken broth"),
 (r"cider vinegar", "Apple cider vinegar"),
 # things that come from the recipe itself or the tap
 (r"^(boiling |warm |cold )?water\b(?! chestnut)|^water,|reserved pasta water|water reserved|reserved cooking broth|turkey pan drippings|pecan milk \(below\)|pecan pie syrup \(below\)|^20% saline", "skip"),
 (r"cold broth or buttermilk", "Chicken broth"),
 # sub-recipes
 (r"^recipe arkansas barbecue sauce|^arkansas barbecue sauce", "sub:Arkansas Barbecue Sauce"),
 (r"^recipe bbq dry rub|^bbq dry rub", "sub:BBQ Dry Rub"),
 (r"^arkansas cajun seasoning blend", "sub:Arkansas Cajun Seasoning Blend"),
 (r"^burger seasoning blend", "sub:Burger Seasoning Blend"),
 (r"classic yellow cheese dip", "sub:Classic Yellow Cheese Dip"),
 (r"^recipe cathead biscuits", "sub:Cathead Biscuits"),
 (r"^recipe homemade country gravy", "sub:Homemade Country Gravy"),
 (r"^recipe mashed potatoes", "sub:Mashed Potatoes"),
 (r"^recipe skillet cornbread", "sub:Skillet Cornbread"),
 (r"^recipe cornbread dressing", "sub:Cornbread Dressing"),
 (r"homemade thousand island", "sub:Homemade Thousand Island Dressing"),
 (r"maple pecan sauce", "Maple syrup + Pecans + Butter"),
 # salts & peppers
 (r"lemon pepper", "Lemon pepper"), (r"frozen green beans", "Frozen green beans"),
 (r"pickling salt", "Pickling salt"), (r"sea salt", "Sea salt"), (r"kosher salt", "Kosher salt"),
 (r"seasoned salt", "Seasoned salt"), (r"^(dash |pinch )?salt\b|^fine salt", "Table salt"),
 (r"white pepper", "White pepper"), (r"peppercorns", "Black peppercorns"),
 (r"aleppo", "Aleppo pepper"), (r"urfa", "Urfa pepper"),
 (r"red pepper flakes", "Red pepper flakes"),
 (r"cayenne", "Cayenne pepper"),
 (r"black pepper|^pepper$|^pepper to taste", "Black pepper"),
 # spices
 (r"smoked paprika", "Smoked paprika"), (r"paprika", "Paprika"),
 (r"chil[ei] powder", "Chili powder"), (r"cumin", "Ground cumin"), (r"coriander", "Ground coriander"), (r"turmeric", "Ground turmeric"),
 (r"curry powder", "Curry powder"), (r"curry paste", "Panang curry paste"), (r"taco seasoning", "Taco seasoning"),
 (r"italian seasoning", "Italian seasoning"), (r"cajun seasoning", "Cajun seasoning"), (r"old bay", "Old Bay seasoning"), (r"poultry seasoning", "Poultry seasoning"),
 (r"garlic powder", "Garlic powder"), (r"onion powder", "Onion powder"),
 (r"oregano", "Dried oregano"), (r"dried rosemary", "Dried rosemary"), (r"rubbed sage|dried sage", "Rubbed sage"),
 (r"bay lea", "Bay leaves"), (r"cinnamon stick", "Cinnamon sticks"), (r"cinnamon", "Ground cinnamon"), (r"nutmeg", "Ground nutmeg"),
 (r"^cloves$|ground cloves", "Ground cloves"), (r"allspice", "Ground allspice"),
 (r"dry mustard|mustard powder", "Dry mustard"), (r"mustard seed", "Mustard seed"), (r"celery seed", "Celery seed"), (r"dill seed", "Dill seed"),
 (r"sumac", "Sumac"), (r"za'atar", "Za'atar"), (r"malt vinegar powder", "Malt vinegar powder"),
 (r"dried dill", "Dried dill"), (r"fresh dill", "Fresh dill"),
 (r"dried parsley", "Dried parsley"), (r"parsley", "Fresh parsley"),
 (r"dried basil", "Dried basil"), (r"basil", "Fresh basil"),
 (r"fresh thyme", "Fresh thyme"), (r"thyme", "Dried thyme"),
 (r"grated ginger|fresh ginger", "Fresh ginger"), (r"^ginger$", "Ground ginger"),
 (r"cilantro", "Cilantro"), (r"chives", "Chives"), (r"makrut", "Makrut lime leaves"), (r"magnolia", "Magnolia blossoms"),
 # flour, sugar, baking
 (r"self-rising flour", "Self-rising flour"), (r"masa harina", "Masa harina"), (r"flour tortilla", "Flour tortillas"), (r"all[- ]purpose flour|^flour$", "All-purpose flour"),
 (r"jiffy", "Jiffy corn muffin mix"), (r"cornmeal", "Yellow cornmeal"), (r"bisquick", "Bisquick"),
 (r"powdered sugar", "Powdered sugar"), (r"palm sugar", "Palm sugar"), (r"brown sugar", "Light brown sugar"), (r"sugar", "Granulated sugar"),
 (r"baking powder", "Baking powder"), (r"baking soda", "Baking soda"), (r"cornstarch", "Cornstarch"),
 (r"instant yeast", "Instant yeast"), (r"yeast", "Active dry yeast"),
 (r"almond extract", "Almond extract"), (r"vanilla extract|^vanilla$|^vanilla \(", "Vanilla extract"),
 (r"corn syrup", "Light corn syrup"), (r"molasses", "Molasses"), (r"maple syrup", "Maple syrup"), (r"honey", "Honey"),
 (r"food colo", "Red food coloring"), (r"cocoa", "Cocoa powder"),
 (r"butterscotch chips", "Butterscotch chips"), (r"chocolate chips", "Semisweet chocolate chips"), (r"chocolate shavings", "Chocolate bar"),
 (r"vanilla pudding", "Instant vanilla pudding"), (r"chocolate pudding", "Instant chocolate pudding"), (r"gelatin", "Strawberry gelatin"),
 (r"marshmallow creme", "Marshmallow creme"), (r"marshmallows", "Mini marshmallows"), (r"flaked coconut", "Sweetened flaked coconut"),
 (r"buttermilk powder|powdered buttermilk", "Buttermilk powder"),
 (r"lard or shortening|shortening", "Shortening"),
 (r"pie crust", "Frozen pie crusts"),
 # dairy & eggs
 (r"evaporated", "Evaporated milk"), (r"condensed milk", "Sweetened condensed milk"),
 (r"coconut milk", "Coconut milk"),
 (r"half[- ]and[- ]half|half and half", "Half-and-half"),
 (r"heavy (whipping )?cream", "Heavy cream"), (r"whipped cream", "Heavy cream"), (r"whipped topping", "Whipped topping"),
 (r"buttermilk", "Buttermilk"),
 (r"greek yogurt", "Greek yogurt"), (r"labneh|strained yogurt", "Labneh"),
 (r"cream cheese", "Cream cheese"), (r"sour cream", "Sour cream"),
 (r"^milk|whole milk|cold whole milk", "Whole milk"),
 (r"margarine", "Margarine"), (r"pecan butter", "Pecan butter"), (r"peanut butter", "Peanut butter"),
 (r"bacon grease or", "Bacon grease"),
 (r"butter", "Butter"),
 (r"egg noodles", "Egg noodles"), (r"\beggs?\b|egg whites|egg yolks", "Eggs"),
 # cheese
 (r"white american", "White American cheese"), (r"velveeta", "Velveeta"),
 (r"^american|american cheese", "Sliced American cheese"),
 (r"white cheddar", "White cheddar cheese"), (r"cheddar", "Shredded cheddar cheese"),
 (r"parmesan|parmigiano", "Parmesan cheese"), (r"mozzarella", "Shredded mozzarella"), (r"monterey jack", "Monterey Jack cheese"),
 (r"pepper jack", "Pepper Jack cheese"), (r"provolone", "Provolone cheese"), (r"swiss", "Swiss cheese"), (r"gruy", "Gruyère cheese"), (r"blue cheese", "Blue cheese crumbles"),
 # meat & seafood
 (r"smoked turkey wings", "Smoked turkey wings"), (r"ham hock", "Smoked ham hock"),
 (r"thick-cut bologna|bologna", "Bologna"), (r"spam", "Spam"),
 (r"ground pork", "Ground pork"), (r"ground venison", "Ground venison"), (r"ground beef|ground chuck", "Ground beef"),
 (r"breakfast sausage", "Breakfast sausage"), (r"italian sausage", "Italian sausage"), (r"andouille", "Andouille sausage"),
 (r"chicken livers", "Chicken livers"), (r"white chicken breast, drained", "Canned chicken"),
 (r"cooked chicken|cubed cooked chicken", "Rotisserie chicken"), (r"whole chicken", "Whole chicken"),
 (r"chicken thighs", "Chicken thighs"), (r"chicken breast", "Chicken breasts"),
 (r"cube steak", "Cube steak"), (r"ribeye", "Ribeye steak"), (r"flank|skirt steak|thinly sliced steak", "Flank steak"),
 (r"boneless pork shoulder or beef chuck", "Pork shoulder"), (r"chuck roast", "Beef chuck roast"), (r"pork shoulder|boston butt", "Pork shoulder"),
 (r"pork chops", "Pork chops"), (r"pork tenderloin", "Pork tenderloin"), (r"pork ribs", "Pork ribs"), (r"spiral-cut", "Spiral ham"), (r"country ham", "Country ham"),
 (r"bacon", "Bacon"),
 (r"turkey neck|giblets", "Whole turkey"), (r"whole turkey", "Whole turkey"), (r"turkey thighs", "Turkey thighs"), (r"sliced roast turkey", "Sliced turkey"), (r"cooked turkey", "Cooked turkey"),
 (r"duck breasts", "Duck breasts"), (r"frog legs", "Frog legs"),
 (r"catfish|white fish fillets", "Catfish fillets"), (r"pink salmon", "Canned salmon"), (r"salmon", "Salmon fillets"),
 (r"crab", "Crab meat"), (r"crawfish", "Crawfish tails"), (r"shrimp", "Shrimp"), (r"oysters", "Oysters"),
 # broths & cans (before produce so "chicken broth" etc. win)
 (r"seafood or chicken stock", "Seafood stock"), (r"vegetable broth", "Vegetable broth"),
 (r"^turkey stock$|^turkey stock,", "Turkey stock"),
 (r"beer or beef broth|beef broth|beef stock|turkey or beef broth", "Beef broth"),
 (r"chicken broth|chicken stock|chicken or (turkey|duck) stock|turkey stock or chicken broth|vegetable stock or chicken broth|vegetable or chicken broth", "Chicken broth"),
 (r"cream of chicken", "Cream of chicken soup"), (r"cream of mushroom", "Cream of mushroom soup"),
 (r"enchilada sauce", "Green enchilada sauce"), (r"pumpkin pur", "Pumpkin purée"), (r"french fried onions", "French fried onions"),
 (r"rotel", "Rotel"), (r"crushed tomatoes", "Crushed tomatoes"), (r"san marzano", "Whole peeled tomatoes"), (r"diced tomatoes", "Diced tomatoes"),
 (r"tomato sauce", "Tomato sauce"), (r"tomato paste", "Tomato paste"), (r"sun-dried", "Sun-dried tomatoes"), (r"marinara", "Marinara sauce"),
 (r"refried beans", "Refried beans"), (r"dried pinto", "Dried pinto beans"), (r"dried red kidney", "Dried kidney beans"), (r"black-eyed peas", "Dried black-eyed peas"),
 (r"black beans", "Black beans"), (r"pinto beans", "Pinto beans"), (r"kidney beans", "Kidney beans"),
 (r"purple hull", "Frozen purple hull peas"), (r"peas and carrots", "Frozen peas and carrots"), (r"frozen peas", "Frozen peas"),
 (r"water chestnuts", "Water chestnuts"), (r"baby corn", "Baby corn"), (r"cream-style corn", "Cream-style corn"),
 (r"fresh sweet corn", "Sweet corn"), (r"frozen corn|corn kernels", "Frozen corn"), (r"corn, drained|sweet corn, drained|whole kernel corn", "Canned corn"),
 (r"diced green chiles", "Diced green chiles"), (r"hatch green chiles", "Hatch green chiles"), (r"pimentos", "Diced pimentos"),
 (r"pineapple chunks", "Canned pineapple"), (r"mandarin", "Mandarin oranges"), (r"maraschino", "Maraschino cherries"),
 (r"corn husks", "Corn husks"), (r"corn tortillas", "Corn tortillas"), (r"wonton", "Wonton wrappers"), (r"taco shells", "Taco shells"),
 # produce
 (r"green onions?|scallions", "Green onions"),
 (r"vidalia|sweet onion", "Sweet onions"), (r"red onion", "Red onions"), (r"white onion", "White onions"), (r"onion", "Yellow onions"),
 (r"roasted garlic|garlic", "Garlic"),
 (r"green bell pepper", "Green bell peppers"), (r"red bell pepper", "Red bell peppers"),
 (r"pickled jalape|jarred jalape|jalape.o juice", "Pickled jalapeños"), (r"jalape", "Jalapeños"), (r"small hot peppers", "Hot peppers"),
 (r"celery", "Celery"), (r"carrots", "Carrots"),
 (r"yukon gold potatoes, sliced", "Yukon Gold potatoes"), (r"baby potatoes|small potatoes", "Baby potatoes"), (r"sweet potato", "Sweet potatoes"),
 (r"potatoes|hash browns", "Russet potatoes"),
 (r"green tomatoes", "Green tomatoes"), (r"tomato", "Tomatoes"),
 (r"lemon", "Lemons"), (r"lime", "Limes"), (r"orange zest", "Oranges"),
 (r"orange juice|pineapple or orange juice", "Orange juice"), (r"pineapple juice", "Pineapple juice"), (r"pineapple", "Pineapple"), (r"apple juice", "Apple juice"),
 (r"coleslaw mix", "Coleslaw mix"), (r"cabbage", "Green cabbage"), (r"lettuce", "Lettuce"), (r"spinach", "Spinach"),
 (r"collard", "Collard greens"), (r"turnip greens", "Turnip greens"), (r"turnip roots", "Turnips"), (r"okra", "Okra"),
 (r"zucchini", "Zucchini"), (r"yellow squash", "Yellow squash"), (r"mushrooms", "Mushrooms"),
 (r"frozen chopped broccoli", "Frozen broccoli"), (r"broccoli", "Broccoli"), (r"green beans", "Green beans"),
 (r"dried peaches", "Dried peaches"), (r"peaches", "Peaches"), (r"figs", "Figs"),
 (r"apples", "Apples"), (r"banana liqueur", "Banana liqueur"), (r"banana", "Bananas"),
 (r"frozen strawberries|fresh or frozen strawberries", "Strawberries"), (r"strawberries", "Strawberries"), (r"blackberries", "Blackberries"), (r"cranberries", "Fresh cranberries"),
 (r"cherry liqueur", "Cherry liqueur"), (r"cherry jam", "Cherries"), (r"cherries", "Cherries"),
 (r"mint", "Fresh mint"),
 # pantry staples
 (r"jasmine rice", "Jasmine rice"), (r"rice vinegar|rice wine vinegar", "Rice vinegar"), (r"crisp rice cereal", "Crisp rice cereal"), (r"\brice\b", "Long-grain white rice"),
 (r"spaghetti", "Spaghetti"), (r"elbow macaroni", "Elbow macaroni"), (r"fettuccine", "Fettuccine"), (r"grits", "Grits"), (r"oats", "Old-fashioned oats"),
 (r"raisins", "Raisins"), (r"pecan", "Pecans"), (r"raw peanuts", "Raw peanuts"),
 (r"saltine", "Saltine crackers"), (r"\britz\b", "Ritz crackers"), (r"panko", "Panko breadcrumbs"), (r"pretzels", "Pretzels"), (r"vanilla wafers", "Vanilla wafers"),
 (r"tortilla chips", "Tortilla chips"),
 (r"texas toast", "Texas toast"), (r"sourdough", "Sourdough bread"), (r"brioche", "Brioche buns"), (r"hamburger buns", "Hamburger buns"), (r"hoagie", "Hoagie rolls"),
 (r"pita", "Pita bread"), (r"bread", "White sandwich bread"),
 # oils, vinegars, sauces, condiments
 (r"peanut oil|peanut or vegetable oil", "Peanut oil"), (r"sesame oil", "Toasted sesame oil"), (r"olive oil", "Olive oil"),
 (r"^oil|vegetable oil|neutral oil", "Vegetable oil"),
 (r"balsamic", "Balsamic vinegar"), (r"cider vinegar", "Apple cider vinegar"), (r"white vinegar", "White vinegar"),
 (r"soy sauce", "Soy sauce"), (r"fish sauce", "Fish sauce"), (r"worcestershire", "Worcestershire sauce"), (r"hot sauce", "Hot sauce"),
 (r"barbecue sauce", "Barbecue sauce"),
 (r"mayonnaise", "Mayonnaise"), (r"dijon", "Dijon mustard"), (r"creole mustard", "Creole mustard"), (r"stone.ground mustard", "Stone-ground mustard"), (r"yellow mustard", "Yellow mustard"),
 (r"ketchup", "Ketchup"),
 (r"sweet pickle relish", "Sweet pickle relish"), (r"dill pickle relish", "Dill pickle relish"), (r"pickle", "Dill pickles"),
 (r"horseradish", "Prepared horseradish"), (r"capers", "Capers"), (r"anchovy", "Anchovy paste"), (r"salsa", "Salsa"),
 (r"italian dressing", "Italian dressing"), (r"ranch", "Ranch dressing"),
 # drinks
 (r"espresso", "Espresso"), (r"coffee", "Coffee"), (r"tea bags", "Tea bags"),
 (r"white wine", "Dry white wine"), (r"red wine", "Red wine"), (r"elderflower", "Elderflower liqueur"), (r"coconut rum", "Coconut rum"), (r"spiced rum", "Spiced rum"), (r"tequila", "Tequila"),
 (r"beer", "Beer"),
 (r"toothpicks", "Toothpicks"),
]
RC = [(re.compile(p), r) for p, r in R]

def resolve(name):
    n = name.strip().lower()
    for k in C:
        if k.lower() == n: return {'items': [k], 'sub': []}
    for rx, res in RC:
        if rx.search(n):
            if res == 'skip': return {'items': [], 'sub': [], 'skip': True}
            parts = [x.strip() for x in res.split('+')]
            return {'items': [x for x in parts if not x.startswith('sub:')], 'sub': [x[4:] for x in parts if x.startswith('sub:')]}
    return None

if __name__ == '__main__':
    names = set()
    for f in sys.argv[1:]:
        names |= {l.strip() for l in open(f) if l.strip()}
    out, missing = {}, []
    for n in sorted(names):
        r = resolve(n)
        if r is None: missing.append(n); continue
        for it in r['items']: assert it in C, (it, n)
        for s in r['sub']: assert s in SUBS, (s, n)
        out[n] = r
    json.dump({'items': {k: list(v) for k, v in C.items()}, 'map': out, 'rules': R}, open('web/ingredients.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print('mapped', len(out), 'missing', len(missing))
    for m in missing: print('  MISSING:', m)
