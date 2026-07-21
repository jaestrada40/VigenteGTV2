// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../src/components/LoginPage';
import RegisterPage from '../src/components/RegisterPage';

vi.mock('../src/api', () => ({ api: { forgotPassword: vi.fn().mockResolvedValue({ message: 'Si la cuenta existe, recibirás un enlace.' }) } }));

describe('navegación de cuenta', () => {
  it('abre el flujo de recuperación desde login', async () => {
    render(<LoginPage setView={vi.fn()} onLoginSuccess={vi.fn()} />);
    await userEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeInTheDocument();
  });

  it('permite navegar desde registro hacia términos', async () => {
    const setView = vi.fn();
    render(<RegisterPage setView={setView} onRegister={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'términos' }));
    expect(setView).toHaveBeenCalledWith('terms');
  });
});
