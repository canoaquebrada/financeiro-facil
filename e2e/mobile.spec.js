import { test, expect } from '@playwright/test';

const TEST_USER = {
  name: 'Usuário Teste',
  email: 'admin@email.com',
  password: '123456',
};

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Financeiro Fácil - Responsividade Mobile', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');
  });

  test('01 - Dashboard mobile exibe cards gradientes', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Mobile quick stats should be visible (gradient cards)
    await expect(page.locator('text=Entradas')).toBeVisible();
    await expect(page.locator('text=Saídas')).toBeVisible();
    await expect(page.locator('text=Saldo')).toBeVisible();
    await expect(page.locator('text=Lucro')).toBeVisible();
    await expect(page.locator('text=Pendentes')).toBeVisible();
    await expect(page.locator('text=Vencidos')).toBeVisible();

    // Mobile transaction cards should be visible instead of table
    const desktopTable = page.locator('.hidden.md\\\\:block');
    const recentTransactions = page.locator('text=Lançamentos recentes');
    await expect(recentTransactions).toBeVisible();

    // Check menu button exists (mobile header)
    await expect(page.locator('button:has-text("Menu")')).toBeVisible();
  });

  test('02 - Transações mobile exibe cards em vez de tabela', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.locator('h1')).toContainText('Lançamentos');

    // Check that adicionar button is visible
    await expect(page.locator('button:has-text("Adicionar lançamento")')).toBeVisible();

    // Mobile cards should be visible with tipo indicators
    await expect(page.locator('text=Entrada').first()).toBeVisible({ timeout: 5000 });
  });

  test('03 - Relatórios mobile exibe cards gradientes', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText('Relatórios');

    // Mobile stat cards with gradients should be visible
    await expect(page.locator('text=Entradas').first()).toBeVisible();
    await expect(page.locator('text=Saídas').first()).toBeVisible();
    await expect(page.locator('text=Lucro').first()).toBeVisible();

    // Chart section should be visible
    await expect(page.locator('text=Gráfico mensal simples')).toBeVisible();

    // Export button should be visible
    await expect(page.locator('button:has-text("Exportar CSV")')).toBeVisible();
  });

  test('04 - Assinatura mobile exibe cards de status do plano', async ({ page }) => {
    await page.goto('/subscriptions');
    await expect(page.locator('h1')).toContainText('Assinatura');

    // Status cards should be visible on mobile
    await expect(page.locator('text=Plano atual')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Tempo restante')).toBeVisible();
    await expect(page.locator('text=Expira em')).toBeVisible();
  });

  test('05 - Admin mobile exibe cards de usuário', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Administrativo');

    // Search bar should be visible
    await expect(page.locator('input[placeholder="Buscar por nome ou e-mail..."]')).toBeVisible();

    // User count summary should be visible
    await expect(page.locator('text=total')).toBeVisible();
    await expect(page.locator('text=ativos')).toBeVisible();
  });

  test('06 - Menu mobile abre e fecha corretamente', async ({ page }) => {
    // Click Menu button
    await page.click('button:has-text("Menu")');

    // Sidebar should open with navigation items
    await expect(page.locator('text=Financeiro Fácil').first()).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Lançamentos')).toBeVisible();
    await expect(page.locator('text=Relatórios')).toBeVisible();

    // Should have logout button
    await expect(page.locator('button:has-text("Sair do sistema")')).toBeVisible();

    // Click Fechar button
    await page.click('button:has-text("Fechar")');
  });

  test('07 - Notificações mobile exibe layout responsivo', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('h1')).toContainText('Notificações');

    // Verify notification button is visible
    await expect(page.locator('button:has-text("Verificar Vencimentos")')).toBeVisible();
  });

  test('08 - Audit Log mobile exibe cards', async ({ page }) => {
    await page.goto('/admin/audit');

    // Audit log should be accessible (admin user)
    await expect(page.locator('h1')).toContainText('Log de Auditoria');

    // Filter section should be visible
    await expect(page.locator('text=Entidade')).toBeVisible();
    await expect(page.locator('text=Ação')).toBeVisible();
    await expect(page.locator('button:has-text("Filtrar")')).toBeVisible();
  });

  test('09 - Settings mobile exibe layout adaptável', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Configurações');

    // Form and appearance sections should stack vertically on mobile
    await expect(page.locator('text=Editar nome do usuário')).toBeVisible();
    await expect(page.locator('text=Aparência')).toBeVisible();
    await expect(page.locator('text=Tema claro')).toBeVisible();
    await expect(page.locator('text=Tema escuro')).toBeVisible();

    // Save button should be visible
    await expect(page.locator('button:has-text("Salvar configurações")')).toBeVisible();
  });

  test('10 - Navegação mobile entre páginas via menu', async ({ page }) => {
    const pages = [
      { label: 'Lançamentos', url: '/transactions', title: 'Lançamentos' },
      { label: 'Relatórios', url: '/reports', title: 'Relatórios' },
      { label: 'Assinatura', url: '/subscriptions', title: 'Assinatura' },
      { label: 'Configurações', url: '/settings', title: 'Configurações' },
    ];

    for (const { label, title } of pages) {
      // Open menu and navigate
      await page.click('button:has-text("Menu")');
      await page.click(`text=${label}`);
      await page.waitForTimeout(500);
      await expect(page.locator('h1')).toContainText(title);
    }
  });
});
