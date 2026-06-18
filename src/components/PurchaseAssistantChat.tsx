"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot } from "lucide-react";
import styles from "./RecipeDetail.module.css";

type DeliveryWindow =
  | "Lo antes posible"
  | "15:00-17:00"
  | "16:00-18:00"
  | "17:00-19:00"
  | "18:00-20:00"
  | "19:00-21:00";

type ChatStep =
  | "introConfirm"
  | "confirmName"
  | "inputName"
  | "confirmRut"
  | "inputRut"
  | "confirmAddress"
  | "inputAddress"
  | "confirmWindow"
  | "selectWindow"
  | "processing"
  | "done";

type OrderDraft = {
  fullName: string;
  rut: string;
  address: string;
  deliveryWindow: DeliveryWindow;
};

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const DELIVERY_WINDOWS: DeliveryWindow[] = [
  "Lo antes posible",
  "15:00-17:00",
  "16:00-18:00",
  "17:00-19:00",
  "18:00-20:00",
  "19:00-21:00",
];

const DEFAULT_ORDER_DRAFT: OrderDraft = {
  fullName: "Juan Pérez",
  rut: "12.345.678-9",
  address: "Av. Vicuña Mackenna 1234, San Joaquín",
  deliveryWindow: "Lo antes posible",
};

export type PurchaseAssistantChatProps = {
  isOpen: boolean;
  onClose: () => void;
  missingIngredientsCount: number;
};

export default function PurchaseAssistantChat({
  isOpen,
  onClose,
  missingIngredientsCount,
}: PurchaseAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("introConfirm");
  const [isTyping, setIsTyping] = useState(false);
  const [showStepControls, setShowStepControls] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(DEFAULT_ORDER_DRAFT);
  const [orderNumber, setOrderNumber] = useState("");

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const messageIdRef = useRef(1);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const orderTotal = missingIngredientsCount * 2170;
  const formattedOrderTotal = useMemo(
    () => `$${orderTotal.toLocaleString("es-CL")}`,
    [orderTotal]
  );

  function clearTimers() {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }

  function schedule(ms: number, callback: () => void) {
    const timeout = setTimeout(callback, ms);
    timersRef.current.push(timeout);
    return timeout;
  }

  function pushMessage(role: ChatMessage["role"], text: string) {
    setMessages((prev) => [...prev, { id: messageIdRef.current++, role, text }]);
  }

  function resetChatState() {
    clearTimers();
    messageIdRef.current = 1;
    setMessages([]);
    setStep("introConfirm");
    setIsTyping(false);
    setShowStepControls(false);
    setInputValue("");
    setOrderDraft(DEFAULT_ORDER_DRAFT);
    setOrderNumber("");
  }

  function showControlsWithDelay(delayMs = 1400) {
    schedule(delayMs, () => {
      setShowStepControls(true);
    });
  }

  function askNameConfirmation() {
    setShowStepControls(false);
    setIsTyping(true);
    
    schedule(1000, () => {
      setIsTyping(false);
      pushMessage(
        "bot",
        `Perfecto. Voy a necesitar que confirmes los datos que tenemos registrados. Empecemos por tu nombre completo.`
      );
      setStep("confirmName");
    });

    schedule(3000, () => {
      setIsTyping(true);
    });

    schedule(5000, () => {
      setIsTyping(false);
      pushMessage("bot", `¿Confirmas que tu nombre es ${orderDraft.fullName}?`);
      setStep("confirmName");
      showControlsWithDelay();
    });
  }

  function askRutConfirmation() {
    setShowStepControls(false);
    setIsTyping(true);
    schedule(1000, () => {
      setIsTyping(false);
      pushMessage("bot", `¿Confirmas que tu RUT es ${orderDraft.rut}?`);
      setStep("confirmRut");
      showControlsWithDelay();
    });
  }

  function askAddressConfirmation() {
    setShowStepControls(false);
    setIsTyping(true);
    schedule(1000, () => {
      setIsTyping(false);
      pushMessage("bot", `¿Confirmas que tu direccion es ${orderDraft.address}?`);
      setStep("confirmAddress");
      showControlsWithDelay();
    });
  }

  function askWindowConfirmation() {
    setShowStepControls(false);
    setIsTyping(true);
    schedule(1000, () => {
      setIsTyping(false);
      pushMessage(
        "bot",
        `Por último, ¿quieres que tu pedido llegue lo antes posible (dentro de 30-60 minutos) o prefieres seleccionar un horario de entrega?`
      );
      setStep("confirmWindow");
      showControlsWithDelay();
    });
  }

  function runCorrectionFlow(nextQuestion: () => void) {
    setIsTyping(true);

    schedule(1100, () => {
      setIsTyping(false);
      pushMessage("bot", "Gracias, lo acabo de corregir.");
    });

    schedule(2300, () => {
      setIsTyping(true);
    });

    schedule(3500, () => {
      setIsTyping(false);
      nextQuestion();
    });
  }

  function startProcessing(deliveryWindow = orderDraft.deliveryWindow) {
    setStep("processing");
    setShowStepControls(false);
    setIsTyping(true);

    schedule(1100, () => {
      setIsTyping(false);
      pushMessage("bot", "Realizando compra, dame un momento por favor");
    });

    schedule(2300, () => {
      setIsTyping(true);
    });

    schedule(7000, () => {
      setIsTyping(false);
      const generatedOrder = `FM-${Date.now().toString().slice(-8)}`;
      setOrderNumber(generatedOrder);
      pushMessage(
        "bot",
        `¡Compra realizada! Llegará a tu domicilio dentro de 90 a 120 minutos, ¡gracias por usar FridgeMatch de Jumbo!\n\nN° pedido: ${generatedOrder}\nPrecio: ${formattedOrderTotal}\nNombre y apellido: ${orderDraft.fullName}\nRUT: ${orderDraft.rut}\nDireccion: ${orderDraft.address}\nHorario de entrega: ${deliveryWindow}`
      );
      setStep("done");
    });
  }

  function submitNameCorrection() {
    const value = inputValue.trim();
    if (!value) return;

    setOrderDraft((prev) => ({ ...prev, fullName: value }));
    setInputValue("");
    pushMessage("user", `${value}`);
    runCorrectionFlow(askRutConfirmation);
  }

  function submitRutCorrection() {
    const value = inputValue.trim();
    if (!value) return;

    setOrderDraft((prev) => ({ ...prev, rut: value }));
    setInputValue("");
    pushMessage("user", `${value}`);
    runCorrectionFlow(askAddressConfirmation);
  }

  function submitAddressCorrection() {
    const value = inputValue.trim();
    if (!value) return;

    setOrderDraft((prev) => ({ ...prev, address: value }));
    setInputValue("");
    pushMessage("user", `${value}`);
    runCorrectionFlow(askWindowConfirmation);
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    submitAction: () => void
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitAction();
  }

  function handleIntroDecision(accepted: boolean) {
    setShowStepControls(false);

    if (!accepted) {
      pushMessage("user", "No");
      onClose();
      return;
    }

    pushMessage("user", "Sí");
    askNameConfirmation();
  }

  function handleNameDecision(confirmed: boolean) {
    setShowStepControls(false);

    if (confirmed) {
      pushMessage("user", "Sí");
      askRutConfirmation();
      return;
    }

    pushMessage("user", "No");
    setIsTyping(true);

    schedule(1100, () => {
      setIsTyping(false);
      pushMessage("bot", "No hay problema, por favor envíame tu nombre y apellido.");
      setStep("inputName");
      showControlsWithDelay();
    });
  }

  function handleRutDecision(confirmed: boolean) {
    setShowStepControls(false);

    if (confirmed) {
      pushMessage("user", "Sí");
      askAddressConfirmation();
      return;
    }

    pushMessage("user", "No");
    setIsTyping(true);

    schedule(1100, () => {
      setIsTyping(false);
      pushMessage("bot", "No hay problema, por favor envíame tu RUT.");
      setStep("inputRut");
      showControlsWithDelay();
    });
  }

  function handleAddressDecision(confirmed: boolean) {
    setShowStepControls(false);

    if (confirmed) {
      pushMessage("user", "Sí");
      askWindowConfirmation();
      return;
    }

    pushMessage("user", "No");
    setIsTyping(true);

    schedule(1100, () => {
      setIsTyping(false);
      pushMessage("bot", "No hay problema, por favor envíame tu direccion.");
      setStep("inputAddress");
      showControlsWithDelay();
    });
  }

  function handleWindowDecision(confirmed: boolean) {
    setShowStepControls(false);

    if (confirmed) {
      pushMessage("user", "Lo antes posible");
      startProcessing();
      return;
    }

    pushMessage("user", "Seleccionar horario");
    pushMessage("bot", "¡Okay! Selecciona un horario de entrega");
    setStep("selectWindow");
  }

  function selectDeliveryWindow(window: DeliveryWindow) {
    setOrderDraft((prev) => ({ ...prev, deliveryWindow: window }));
    pushMessage("user", `${window}`);
    startProcessing(window);
  }

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      return;
    }

    resetChatState();
    setIsTyping(true);
    setShowStepControls(false);

    schedule(1000, () => {
      setIsTyping(false);
      pushMessage(
        "bot",
        "¡Hola! Soy tu asistente de compra de Jumbo y estoy aquí para simplificar tu cocina."
      );
    });

    schedule(2200, () => {
      setIsTyping(true);
    });

    schedule(3600, () => {
      setIsTyping(false);
      pushMessage(
        "bot",
        `Con los ingredientes que te faltan, el total de tu compra es de ${formattedOrderTotal}, incluyendo el envío a domicilio.`
      );
    });

    schedule(5000, () => {
      setIsTyping(true);
    });

    schedule(6400, () => {
      setIsTyping(false);
      pushMessage("bot", "¿Quieres que realice la compra por ti?");
      setStep("introConfirm");
      showControlsWithDelay();
    });

    return () => {
      clearTimers();
    };
  }, [isOpen, formattedOrderTotal]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping, step, showStepControls]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.chatOverlay} onClick={onClose}>
      <div className={styles.chatCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.chatHeader}>
          <div className={styles.chatTitleWrap}>
            <Bot size={16} aria-hidden="true" />
            <strong>Asistente de compra</strong>
          </div>
          <button type="button" className={styles.chatCloseBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.chatMessages} ref={messagesRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.chatBubble} ${
                message.role === "bot" ? styles.chatBubbleBot : styles.chatBubbleUser
              }`}
            >
              {message.text}
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.chatBubble} ${styles.chatBubbleBot}`}>
              <span className={styles.typingDots} aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
        </div>

        {step === "introConfirm" && showStepControls && (
          <div className={styles.chatActions}>
            <button
              type="button"
              className={styles.chatPrimaryAction}
              onClick={() => handleIntroDecision(true)}
            >
              Sí
            </button>
            <button
              type="button"
              className={styles.chatSecondaryAction}
              onClick={() => handleIntroDecision(false)}
            >
              No
            </button>
          </div>
        )}

        {step === "confirmName" && showStepControls && (
          <div className={styles.chatActions}>
            <button
              type="button"
              className={styles.chatPrimaryAction}
              onClick={() => handleNameDecision(true)}
            >
              Sí
            </button>
            <button
              type="button"
              className={styles.chatSecondaryAction}
              onClick={() => handleNameDecision(false)}
            >
              No
            </button>
          </div>
        )}

        {step === "inputName" && showStepControls && (
          <div className={styles.chatComposer}>
            <input
              type="text"
              className={styles.chatInput}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => handleComposerKeyDown(event, submitNameCorrection)}
              placeholder="Escribe tu nombre y apellido"
            />
            <button type="button" className={styles.chatPrimaryAction} onClick={submitNameCorrection}>
              Enviar
            </button>
          </div>
        )}

        {step === "confirmRut" && showStepControls && (
          <div className={styles.chatActions}>
            <button
              type="button"
              className={styles.chatPrimaryAction}
              onClick={() => handleRutDecision(true)}
            >
              Sí
            </button>
            <button
              type="button"
              className={styles.chatSecondaryAction}
              onClick={() => handleRutDecision(false)}
            >
              No
            </button>
          </div>
        )}

        {step === "inputRut" && showStepControls && (
          <div className={styles.chatComposer}>
            <input
              type="text"
              className={styles.chatInput}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => handleComposerKeyDown(event, submitRutCorrection)}
              placeholder="Escribe tu RUT"
            />
            <button type="button" className={styles.chatPrimaryAction} onClick={submitRutCorrection}>
              Enviar
            </button>
          </div>
        )}

        {step === "confirmAddress" && showStepControls && (
          <div className={styles.chatActions}>
            <button
              type="button"
              className={styles.chatPrimaryAction}
              onClick={() => handleAddressDecision(true)}
            >
              Sí
            </button>
            <button
              type="button"
              className={styles.chatSecondaryAction}
              onClick={() => handleAddressDecision(false)}
            >
              No
            </button>
          </div>
        )}

        {step === "inputAddress" && showStepControls && (
          <div className={styles.chatComposer}>
            <input
              type="text"
              className={styles.chatInput}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => handleComposerKeyDown(event, submitAddressCorrection)}
              placeholder="Escribe tu dirección"
            />
            <button
              type="button"
              className={styles.chatPrimaryAction}
              onClick={submitAddressCorrection}
            >
              Enviar
            </button>
          </div>
        )}

        {step === "confirmWindow" && showStepControls && (
          <div className={styles.chatActions}>
            <button
              type="button"
              className={styles.chatPrimaryAction}
              onClick={() => handleWindowDecision(true)}
            >
              Lo antes posible
            </button>
            <button
              type="button"
              className={styles.chatSecondaryAction}
              onClick={() => handleWindowDecision(false)}
            >
              Seleccionar horario
            </button>
          </div>
        )}

        {step === "selectWindow" && (
          <div className={styles.chatOptionsWrap}>
            {DELIVERY_WINDOWS.map((window) => (
              <button
                key={window}
                type="button"
                className={styles.chatOptionBtn}
                onClick={() => selectDeliveryWindow(window)}
              >
                {window}
              </button>
            ))}
          </div>
        )}

        {step === "done" && (
          <div className={styles.chatSessionEndWrap}>
            <p className={styles.chatSessionEndNotice}>Sesión finalizada</p>
            <button type="button" className={styles.chatSessionEndBtn} onClick={onClose}>
              Cerrar chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
