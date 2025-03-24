<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    // Icons (you're already using Lucide icons in your project)
    import House from 'lucide-svelte/icons/house';
    import LayoutGrid from 'lucide-svelte/icons/layout-grid';
    import FileText from 'lucide-svelte/icons/file-text';
    import Package from 'lucide-svelte/icons/package';
    import LogOut from 'lucide-svelte/icons/log-out';
    
    function logout() {
      // Clear auth data
      localStorage.removeItem('authKey');
      // Redirect to auth page
      goto('/auth');
    }
  </script>
  
  <div class="sidebar">
    <div class="logo">
      <img src="https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/logoVietTriPNG-300x68.png" alt="logo" class="w-full bg-white rounded-md h-auto">
    </div>
    
    <nav>
      <ul>
        <li class:active={$page.url.pathname === '/'}>
          <a href="/">
            <House class="icon" />
            <span class="ml-2 font-semibold">TỔNG QUAN</span>
          </a>
        </li>
        
        <li class:active={$page.url.pathname.startsWith('/patterns')}>
          <a href="/patterns">
            <LayoutGrid class="icon" />
            <span class="ml-2 font-semibold">MẪU MÃ</span>
          </a>
        </li>
        
        <li class:active={$page.url.pathname.startsWith('/posts')}>
          <a href="/posts">
            <FileText class="icon" />
            <span class="ml-2 font-semibold">BÀI VIẾT</span>
          </a>
        </li>
        
        <li class:active={$page.url.pathname.startsWith('/products')}>
          <a href="/products">
            <Package class="icon" />
            <span class="ml-2 font-semibold">SẢN PHẨM</span>
          </a>
        </li>
      </ul>
    </nav>
    
    <div class="spacer"></div>
    
    <div class="logout-container">
      <button on:click={logout} class="logout-button">
        <LogOut class="icon" />
        <span class="ml-2 font-semibold">ĐĂNG XUẤT</span>
      </button>
    </div>
  </div>
  
  <style>
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 200px;
      height: 100vh;
      background-color: #1257a7;
      color: white;
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      z-index: 100;
    }
    
    .logo {
      margin-top: 10px;
      padding: 0 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .logo h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    
    nav {
      margin-top: 20px;
      flex: 0;
    }
    
    .spacer {
      flex: 1;
    }
    
    .logout-container {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .logout-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      border-radius: 4px;
    }
    
    .logout-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    li {
      margin-bottom: 2px;
    }
    
    li a {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: all 0.2s;
    }
    
    li a:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    li.active a {
      background-color: rgba(255, 255, 255, 0.15);
      color: white;
      border-left: 3px solid white;
    }
    
    .icon {
      width: 18px;
      height: 18px;
      margin-right: 10px;
    }
  </style>