import { test, expect } from '@playwright/test';

const TEST_USER = {
  name: 'Usuário Teste',
  email: 'admin@email.com',
  password: '123456',
};

test.describe('Financeiro Fácil - Testes Completos', () => {
  test('01 - Registro de novo usuário', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText('Criar conta');

    await page.fill('input[placeholder="Seu nome"]', TEST_USER.name);
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Mínimo 6 caracteres"]', TEST_USER.password);
    await page.click('button:has-text("Criar conta")');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('02 - Dashboard carrega com dados corretos', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Saldo atual')).toBeVisible();
    await expect(page.locator('text=Total de entradas do mês')).toBeVisible();
    await expect(page.locator('text=Total de saídas do mês')).toBeVisible();
    await expect(page.locator('text=Lucro do mês')).toBeVisible();
    await expect(page.locator('text=Lançamentos pendentes')).toBeVisible();
    await expect(page.locator('text=Lançamentos vencidos')).toBeVisible();
  });

  test('03 - Transações - CRUD completo (renumerado)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

  test('05 - Transações - CRUD completo', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.goto('/transactions');
    await expect(page.locator('h1')).toContainText('Lançamentos');

    await page.click('button:has-text("Adicionar lançamento")');
    await expect(page.locator('text=Novo lançamento')).toBeVisible();

    await page.fill('input[placeholder="Ex.: Venda de serviço"]', 'Transação Automatada');
    await page.fill('input[placeholder="0,00"]', '250');
    await page.click('button:has-text("Salvar")');

    await expect(page.locator('text=Transação Automatada')).toBeVisible();

    await page.click('button:has-text("Editar") >> nth=0');
    await page.fill('input[placeholder="Ex.: Venda de serviço"]', '');
    await page.fill('input[placeholder="Ex.: Venda de serviço"]', 'Transação Editada PW');
    await page.click('button:has-text("Salvar")');
    await expect(page.locator('text=Transação Editada PW')).toBeVisible();

    await page.selectOption('select >> nth=0', 'entrada');
    await page.selectOption('select >> nth=1', 'pago');

    page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await page.click('button:has-text("Excluir") >> nth=0');
  });

  test('06 - Relatórios carrega e exibe dados', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText('Relatórios');
    await expect(page.locator('text=Total de entradas')).toBeVisible();
    await expect(page.locator('text=Total de saídas')).toBeVisible();
    await expect(page.locator('text=Lucro')).toBeVisible();
  });

  test('07 - Assinatura - exibe planos e informações', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.goto('/subscriptions');
    await expect(page.locator('h1')).toContainText('Assinatura');
    await expect(page.locator('text=Plano atual')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Tempo restante')).toBeVisible();
    await expect(page.locator('text=Expira em')).toBeVisible();
  });

  test('08 - Configurações - alterar nome e tema', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Configurações');

    const newName = 'Usuário Atualizado';
    await page.fill('input >> nth=0', '');
    await page.fill('input >> nth=0', newName);
    await page.click('button:has-text("Salvar configurações")');
    await expect(page.locator('text=Configurações salvas com sucesso')).toBeVisible();

    await page.click('text=Tema escuro');
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    await page.click('text=Tema claro');
    const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    expect(isLight).toBe(true);
  });

  test('09 - Admin - acesso ao painel administrativo', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Administrativo');
    await expect(page.locator('text=Total de usuários')).toBeVisible();
    await expect(page.locator('text=Usuários comuns')).toBeVisible();
    await expect(page.locator('text=Administradores')).toBeVisible();
  });

  test('10 - Logout funciona corretamente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.click('button:has-text("Sair do sistema")');
    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toContainText('Entrar');
  });

  test('11 - Login com dados corretos', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Entrar');

    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator(`text=Olá, ${TEST_USER.name}`)).toBeVisible();
  });

  test('12 - Login com dados inválidos mostra erro', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[placeholder="voce@empresa.com"]', 'invalido@email.com');
    await page.fill('input[placeholder="Sua senha"]', 'senhaerrada');
    await page.click('button:has-text("Entrar")');

    await expect(page.locator('text=E-mail ou senha inválidos')).toBeVisible();
  });

  test('13 - Navegação entre páginas funciona', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    const pages = [
      { label: 'Dashboard', url: '/dashboard', title: 'Dashboard' },
      { label: 'Lançamentos', url: '/transactions', title: 'Lançamentos' },
      { label: 'Relatórios', url: '/reports', title: 'Relatórios' },
      { label: 'Assinatura', url: '/subscriptions', title: 'Assinatura' },
      { label: 'Configurações', url: '/settings', title: 'Configurações' },
      { label: 'Administrativo', url: '/admin', title: 'Administrativo' },
    ];

    for (const { title } of pages) {
      await page.click(`text=${title}`);
      await page.waitForTimeout(1000);
      await expect(page.locator('h1')).toContainText(title);
    }
  });

  test('14 - Registro com email duplicado mostra erro', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[placeholder="Seu nome"]', 'Duplicado');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Mínimo 6 caracteres"]', TEST_USER.password);
    await page.click('button:has-text("Criar conta")');

    await expect(page.locator('text=Este e-mail já está cadastrado')).toBeVisible();
  });

  test('15 - Filtros de transações funcionam', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="voce@empresa.com"]', TEST_USER.email);
    await page.fill('input[placeholder="Sua senha"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard');

    await page.goto('/transactions');
    await page.selectOption('select >> nth=0', 'entrada');
    await page.waitForTimeout(500);
    await page.selectOption('select >> nth=1', 'pago');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Limpar filtros")');
    await page.waitForTimeout(500);
  });


});
