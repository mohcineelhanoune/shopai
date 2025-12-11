
import { supabase } from './supabase';
import { Order, User, Product, Category, BannerSlide, MenuItem, Contact } from '../types';

// --- User & Address ---

export const saveUserAddress = async (userId: string, addressData: any) => {
  try {
    const { error } = await supabase
      .from('user_addresses')
      .upsert({ 
        user_id: userId,
        ...addressData,
        is_default: true 
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving address:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
       console.error("Error fetching profile", JSON.stringify(error, null, 2));
    }

    return data ? { address: data } : null;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
};

// --- Products ---

export const fetchProductsFromDB = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      description: p.description,
      category: p.category_id || p.category || 'General', 
      image: p.main_image_url,
      images: p.gallery_images || [],
      rating: { rate: Number(p.rating_rate || 0), count: p.rating_count || 0 },
      ft_url: p.ft_url,
      fi_url: p.fi_url,
      stock: (p.stock !== null && p.stock !== undefined) ? Number(p.stock) : 10
    }));
  } catch (error) {
    console.error("Error fetching products:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const addProductToDB = async (product: Product) => {
  try {
    const { error } = await supabase
      .from('products')
      .insert({
        title: product.title,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice || null,
        main_image_url: product.image,
        gallery_images: product.images || [],
        category: product.category,
        rating_rate: product.rating.rate,
        rating_count: product.rating.count,
        is_active: true,
        ft_url: product.ft_url || null,
        fi_url: product.fi_url || null,
        stock: product.stock !== undefined ? product.stock : 10
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding product:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateProductInDB = async (product: Product) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        title: product.title,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice || null,
        main_image_url: product.image,
        gallery_images: product.images || [],
        category: product.category,
        ft_url: product.ft_url || null,
        fi_url: product.fi_url || null,
        stock: product.stock !== undefined ? product.stock : 10
      })
      .eq('id', product.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating product:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const deleteProductFromDB = async (productId: number | string) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting product:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// --- Categories ---

export const fetchCategoriesFromDB = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      image: c.image_url || c.image, 
      description: c.description,
      productCount: c.product_count || 0 // Default fallback
    }));
  } catch (error) {
    console.error("Error fetching categories:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const addCategoryToDB = async (category: Category) => {
  try {
    const { error } = await supabase.from('categories').insert({
      name: category.name,
      image_url: category.image,
      description: category.description || '',
      // product_count removed as it caused column missing error
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error adding category:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// --- Banners ---

export const fetchBannersFromDB = async (): Promise<BannerSlide[]> => {
  try {
    const { data, error } = await supabase.from('banners').select('*');
    if (error) throw error;
    return data.map((b: any) => ({
      id: b.id,
      image: b.image,
      title: b.title,
      subtitle: b.subtitle,
      cta: b.cta || '', // Default fallback
      link: b.link,
      align: b.align || 'left'
    }));
  } catch (error) {
    console.error("Error fetching banners:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const addBannerToDB = async (banner: BannerSlide) => {
  try {
    const { error } = await supabase.from('banners').insert({
      image: banner.image,
      title: banner.title || null,
      subtitle: banner.subtitle || null,
      link: banner.link || null,
      // Removed cta and align from insert to prevent errors if columns missing
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error adding banner:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateBannerInDB = async (banner: BannerSlide) => {
  try {
    const { error } = await supabase.from('banners').update({
      image: banner.image,
      title: banner.title || null,
      subtitle: banner.subtitle || null,
      link: banner.link || null,
      // Removed cta and align from update
    }).eq('id', banner.id);
    if (error) throw error;
  } catch (error) {
    console.error("Error updating banner:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const deleteBannerFromDB = async (id: number) => {
  try {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting banner:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// --- Menu Items ---

export const fetchMenuItemsFromDB = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return data.map((m: any) => ({
      id: m.id.toString(),
      label: m.label,
      view: m.view || 'HOME', // Default fallback
      icon: m.icon_name || m.icon || 'Menu', 
      order: m.sort_order,
      isSpecial: m.is_special
    }));
  } catch (error) {
    console.error("Error fetching menu items:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const upsertMenuItemToDB = async (item: MenuItem) => {
  try {
    const payload: any = {
      label: item.label,
      // view removed as it caused column missing error
      icon_name: item.icon, 
      sort_order: item.order,
      is_special: item.isSpecial || false
    };
    
    if (item.id && !isNaN(Number(item.id))) {
        payload.id = Number(item.id);
    }

    const { error } = await supabase.from('menu_items').upsert(payload);
    if (error) throw error;
  } catch (error) {
    console.error("Error upserting menu item:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const deleteMenuItemFromDB = async (id: string) => {
  try {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting menu item:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// --- Contacts ---

export const fetchContactsFromDB = async (): Promise<Contact[]> => {
  try {
    const { data, error } = await supabase.from('contacts').select('*');
    if (error) throw error;
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      type: c.type,
      company: c.company,
      address: c.address,
      status: c.status
    }));
  } catch (error) {
    console.error("Error fetching contacts:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const addContactToDB = async (contact: Omit<Contact, 'id'>) => {
  try {
    const { error } = await supabase.from('contacts').insert({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        company: contact.company || null,
        address: contact.address,
        status: contact.status
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error adding contact:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateContactInDB = async (contact: Contact) => {
  try {
    const { error } = await supabase.from('contacts').update({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        company: contact.company || null,
        address: contact.address,
        status: contact.status
    }).eq('id', contact.id);
    if (error) throw error;
  } catch (error) {
    console.error("Error updating contact:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const deleteContactFromDB = async (id: number) => {
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting contact:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// --- Orders (Commande) ---

export const createOrder = async (order: Omit<Order, 'id'>) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const userId = (order.customerId && uuidRegex.test(order.customerId)) ? order.customerId : null;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        total_amount: order.total,
        status: order.status,
        shipping_address: typeof order.shippingAddress === 'string' ? order.shippingAddress : JSON.stringify(order.shippingAddress),
        payment_method: order.paymentMethod
      })
      .select()
      .single();

    if (orderError) {
        console.error("Supabase Order Insert Error:", JSON.stringify(orderError, null, 2));
        throw orderError;
    }

    const itemsToInsert = order.items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
        if (itemsError.code === '23503') {
            console.warn("Product ID mismatch. Retrying items with null product_id.");
            const fallbackItems = itemsToInsert.map(i => ({...i, product_id: null}));
            const { error: fallbackError } = await supabase.from('order_items').insert(fallbackItems);
            if (fallbackError) {
                console.error("Supabase Fallback Item Insert Error:", JSON.stringify(fallbackError, null, 2));
                throw fallbackError;
            }
        } else {
            console.error("Supabase Order Items Insert Error:", JSON.stringify(itemsError, null, 2));
            throw itemsError;
        }
    }

    return orderData.id;
  } catch (error) {
    console.error("Error creating order:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating order status:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const getUserOrders = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((o: any) => ({
      id: o.id,
      customerId: o.user_id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      date: new Date(o.created_at).toLocaleDateString(),
      status: o.status,
      total: Number(o.total_amount),
      shippingAddress: o.shipping_address,
      paymentMethod: o.payment_method,
      items: o.items.map((i: any) => ({
        productId: i.product_id,
        productName: i.product_name,
        quantity: i.quantity,
        price: Number(i.unit_price)
      }))
    })) as Order[];
  } catch (error) {
    console.error("Error fetching user orders:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const getAllOrders = async () => {
    try {
        const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((o: any) => ({
            id: o.id,
            customerId: o.user_id,
            customerName: o.customer_name,
            customerEmail: o.customer_email,
            date: new Date(o.created_at).toLocaleDateString(),
            status: o.status,
            total: Number(o.total_amount),
            shippingAddress: o.shipping_address,
            paymentMethod: o.payment_method,
            items: o.items.map((i: any) => ({
                productId: i.product_id,
                productName: i.product_name,
                quantity: i.quantity,
                price: Number(i.unit_price)
            }))
        })) as Order[];
    } catch (error) {
        console.error("Error fetching all orders:", JSON.stringify(error, null, 2));
        return [];
    }
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  getAllOrders().then(callback);
  const channel = supabase
    .channel('public:orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      getAllOrders().then(callback);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
