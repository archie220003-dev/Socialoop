import React from 'react';

const SkeletonPost = () => {
  return (
    <div className="post-card glass skeleton-card">
      <div className="post-header">
        <div className="avatar skeleton-bg"></div>
        <div className="author-info" style={{ width: '100%' }}>
          <div className="skeleton-bg" style={{ height: '16px', width: '30%', marginBottom: '4px', borderRadius: '4px' }}></div>
          <div className="skeleton-bg" style={{ height: '12px', width: '20%', borderRadius: '4px' }}></div>
        </div>
      </div>
      
      <div className="post-title skeleton-bg" style={{ height: '24px', width: '80%', borderRadius: '6px', marginBottom: '16px' }}></div>
      <div className="post-body skeleton-bg" style={{ height: '16px', width: '100%', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div className="post-body skeleton-bg" style={{ height: '16px', width: '90%', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div className="post-body skeleton-bg" style={{ height: '16px', width: '60%', borderRadius: '4px', marginBottom: '16px' }}></div>

      <div className="post-footer" style={{ borderTop: '1px solid var(--surface-border)' }}>
        <div className="skeleton-bg" style={{ height: '28px', width: '80px', borderRadius: '20px' }}></div>
        <div className="skeleton-bg" style={{ height: '28px', width: '100px', borderRadius: '20px', marginLeft: '16px' }}></div>
      </div>
    </div>
  );
};

export default SkeletonPost;
