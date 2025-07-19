
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function PublicDisplayView() {
  const { slug } = useParams();
  const [license, setLicense] = useState(null);

  useEffect(() => {
    async function fetchLicense() {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching license:', error.message);
        return;
      }

      setLicense(data);
    }

    fetchLicense();
  }, [slug]);

  if (!license) return <div>Cargando pantalla pública...</div>;

  return (
    <div>
      <h1>Pantalla Pública - {license.company_name}</h1>
      {/* Aquí mostrar información relacionada con turnos en tiempo real */}
    </div>
  );
}
