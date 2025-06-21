// backend/controllers/productController.js
const supabase = require('../services/supabaseService');

// This function gets all products and joins them with their inventory quantities
const getAllProductsWithInventory = async (req, res) => {
    try {
        // This query gets all active products and calculates their total stock
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id,
                sku,
                name_en,
                name_km,
                description,
                category,
                image_url,
                selling_price,
                is_active,
                inventory ( quantity )
            `)
            .eq('is_active', true);

        if (error) throw error;

        // The query gives us an array of inventory records. We need to sum them up.
        const productsWithTotalStock = products.map(p => {
            const total_stock = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            delete p.inventory; // Clean up the response
            return { ...p, total_stock };
        });

        res.status(200).json(productsWithTotalStock);
    } catch (err) {
        console.error('Error fetching products with inventory:', err.message);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
};

const getPublicProducts = async (req, res) => {
    try {
        // We only want to show active products that are in stock at the retail location.
        // This query is more complex and specific to the public view.
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name_en,
                category,
                image_url,
                selling_price,
                inventory ( quantity )
            `)
            .eq('is_active', true) // Only show active products
            // You might add another .eq() to filter by a specific retail warehouse ID later

        if (error) throw error;

        // The result gives an array of inventory records. Let's simplify it.
        const formattedData = data.map(product => {
            // Sum up the stock from all inventory records (in case a product is in multiple warehouses)
            const total_stock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            return {
                id: product.id,
                name_en: product.name_en,
                category: product.category,
                image_url: product.image_url,
                selling_price: product.selling_price,
                stock_level: total_stock
            };
        }); // Final filter to remove items that might sum to 0

        res.status(200).json(formattedData);

    } catch (err) {
        console.error('Error fetching public products:', err);
        res.status(500).json({ error: 'Failed to retrieve products.' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL (e.g., /api/products/123)

        const { data: product, error } = await supabase
            .from('products')
            .select(`
                id,
                name_en,
                name_km,
                description,
                category,
                image_url,
                selling_price,
                inventory ( quantity )
            `)
            .eq('id', id)
            .eq('is_active', true) // Ensure we don't show inactive products
            .single(); // .single() is crucial here, as we expect only one result

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is the code for "no rows found", which we handle next.
            // Throw other errors.
            throw error;
        }

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        
        // Just like in your other functions, let's calculate the total stock
        const total_stock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        delete product.inventory; // Clean up the response object
        product.stock_level = total_stock;

        res.status(200).json(product);

    } catch (err) {
        console.error('Error fetching single product:', err.message);
        res.status(500).json({ error: 'Failed to retrieve product.' });
    }
};

const createProduct = async (req, res) => {
    // Note: We get all product data from the request body
    const { sku, name_en, name_km, category, selling_price, purchase_price, reorder_point, image_url, description } = req.body;

    if (!sku || !name_en || !category || !selling_price) {
        return res.status(400).json({ error: 'SKU, Name, Category, and Selling Price are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                sku, name_en, name_km, category, selling_price, purchase_price, reorder_point, image_url, description, 
                is_active: true // New products are active by default
            }])
            .select()
            .single(); // Return the newly created product

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Failed to create product.' });
    }
};

// UPDATE an existing product
const updateProduct = async (req, res) => {
    const { id } = req.params;
    // Get updated data from the body
    const { sku, name_en, name_km, category, selling_price, purchase_price, reorder_point, image_url, description, is_active } = req.body;

    try {
        const { data, error } = await supabase
            .from('products')
            .update({ sku, name_en, name_km, category, selling_price, purchase_price, reorder_point, image_url, description, is_active })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Product not found.' });
        
        res.status(200).json(data);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
};

// DELETE a product (soft delete by setting is_active to false)
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('products')
            .update({ is_active: false }) // We don't permanently delete, just deactivate
            .eq('id', id);

        if (error) throw error;
        res.status(204).send(); // 204 No Content is standard for successful delete
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
};

const getDetailedInventory = async (req, res) => {
    try {
        // This is a more complex query. It gets all products
        // and for each product, it gets a nested array of its inventory records,
        // and for each inventory record, it gets the name of the warehouse.
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                sku,
                name_en,
                name_km,
                inventory (
                    quantity,
                    warehouse:warehouses ( id, name )
                )
            `)
            .order('name_en', { ascending: true });

        if (error) throw error;
        
        // The data is good as-is. We'll process it on the frontend.
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching detailed inventory:', err.message);
        res.status(500).json({ error: 'Failed to fetch detailed inventory.' });
    }
};




module.exports = {
    getAllProductsWithInventory,
    getPublicProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getDetailedInventory
};