
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function CustomerView() {PublicDisplayViewcostu
  const { slug } = useParams();
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching license:', error.message);
        return;
      }

      setCustomerData(data);
    }

    fetchData();
  }, [slug]);

  if (!customerData) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Panel del Cliente: {customerData.company_name}</h1>
      {/* Aquí puedes usar más campos como customerData.logo_url, etc */}
    </div>
  );
}
