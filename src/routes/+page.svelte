<script lang="ts">
  import { onMount } from 'svelte';
  
  
  onMount(() => {
    // You could fetch real data here
  });
</script>

<div class="dashboard">
  <div class="welcome-section">
    <h1>Tổng Quan Hệ Thống</h1>
    <p>Chào mừng đến với hệ thống quản lý Viet Tri. Xem tổng quan về hoạt động của website.</p>
  </div>
  
  <div class="stats-cards">
    <a href="/products" class="stat-card">
      <div class="stat-icon products">
        <span class="icon-placeholder">📦</span>
      </div>
      <div class="stat-content">
        <h3>Sản Phẩm</h3>
        <span class=" text-blue-600 underline ">Đến trang sản phẩm</span>
      </div>
    </a>
    
    <a href="/patterns" class="stat-card">
      <div class="stat-icon patterns">
        <span class="icon-placeholder">📊</span>
      </div>
      <div class="stat-content">
        <h3>Mẫu Mã</h3>
        <span class="text-sm text-blue-600 underline ">Đến trang mẫu mã</span>
      </div>
    </a>
    
    <a href="/posts" class="stat-card">
      <div class="stat-icon posts">
        <span class="icon-placeholder">📄</span>
      </div>
      <div class="stat-content">
        <h3>Bài Viết</h3>
        <span class="text-sm text-blue-600 underline ">Đến trang bài viết</span>
      </div>
    </a>

  </div>
  
</div>

<style>
  .dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .welcome-section {
    margin-bottom: 30px;
  }
  
  .welcome-section h1 {
    font-size: 28px;
    color: #1257a7;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .welcome-section p {
    font-size: 16px;
    color: #555;
    line-height: 1.5;
  }
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    color: white;
    font-size: 24px;
  }
  
  .icon-placeholder {
    font-size: 24px;
  }
  
  .products {
    background: linear-gradient(45deg, #3a86ff, #2667ce);
  }
  
  .patterns {
    background: linear-gradient(45deg, #ff9e00, #e67700);
  }
  
  .posts {
    background: linear-gradient(45deg, #00b4d8, #0096c7);
  }
  
  
  .stat-content h3 {
    font-size: 14px;
    color: #666;
    margin: 0 0 5px;
    font-weight: 500;
  }
  

</style>
