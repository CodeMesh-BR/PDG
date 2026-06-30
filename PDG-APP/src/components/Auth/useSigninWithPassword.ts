'use client';

import { API_BASE_URL } from "@/lib/api";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SigninData {
  email: string;
  password: string;
  remember: boolean;
}

export function useSigninWithPassword() {
  const [data, setData] = useState<SigninData>({
    email: '',
    password: '',
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setError('');
  const { name, value, type, checked } = e.target;
  setData((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(result?.message || 'Erro ao fazer login');
      }
      if (!result?.access_token) {
        throw new Error('Resposta inválida da API no login.');
      }

      localStorage.setItem('token', result.access_token);
      const role = (result.user?.role || "").toLowerCase();
      localStorage.setItem("role", role);

      navigate(role === "detailer" ? "/start-service" : "/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    setData,
    handleChange,
    handleSubmit,
    loading,
    error,
  };
}
