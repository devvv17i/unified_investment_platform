


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Preloader from './Preloader';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = '3907d626a8bf4a5c82ae2a60dcb0f428'; // Replace with your News API Key
        const apiUrl = `https://newsapi.org/v2/everything?q=stock%20market&sortBy=publishedAt&apiKey=${apiKey}`;

        const response = await axios.get(apiUrl);
        setNews(response.data.articles);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

 
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f8ff' }}>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
     <div>
      <Navbar />

      <Preloader onLoadingComplete={() => setLoading(false)} />
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f0f8ff', color: '#333' }}>
      <h1 className='text-3xl font-bold' style={{ color: '#007bff', textAlign: 'center', marginBottom: '30px' }}>Latest Stock Market News</h1>
      {news.map((article, index) => (
        <div
          key={index}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '20px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white'
          }}
        >
          <h2 style={{ color: '#007bff', marginBottom: '10px' }}>{article.title}</h2>
          {article.urlToImage && (
            <img
            className='py-4'
              src={article.urlToImage}
              alt={article.title}
              style={{ maxWidth: '400px', height: 'auto', marginBottom: '15px', borderRadius: '4px' }}
            />
          )}
          <p style={{ marginBottom: '10px' }}>{article.description}</p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            Read more
          </a>
          <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
            Source: {article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
    </div>
  );
};

export default News;