// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../src/components/LoginPage';
import RegisterPage from '../src/components/RegisterPage';
import { api } from '../src/api';

vi.mock('../src/api', () => ({ api: {
  forgotPassword: vi.fn().mockResolvedValue({ message: 'Si la cuenta existe, recibirás un enlace.' }),
  login: vi.fn(), completeMfa: vi.fn(),
} }));

afterEach(cleanup);

describe('navegación de cuenta', () => {
  it('abre el flujo de recuperación desde login', async () => {
    render(<LoginPage setView={vi.fn()} onLoginSuccess={vi.fn()} />);
    await userEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeInTheDocument();
  });

  it('permite mostrar y ocultar la contraseña de forma accesible', async () => {
    render(<LoginPage setView={vi.fn()} onLoginSuccess={vi.fn()} />);
    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('muestra el segundo paso cuando la cuenta tiene MFA', async () => {
    vi.mocked(api.login).mockResolvedValueOnce({ mfaRequired: true, mfaTicket: 'ticket-seguro' });
    render(<LoginPage setView={vi.fn()} onLoginSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Password12345');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getByLabelText('Código de autenticación o recuperación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verificar código' })).toBeInTheDocument();
  });

  it('permite navegar desde registro hacia términos', async () => {
    const setView = vi.fn();
    render(<RegisterPage setView={setView} onRegister={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'términos' }));
    expect(setView).toHaveBeenCalledWith('terms');
  });
});
