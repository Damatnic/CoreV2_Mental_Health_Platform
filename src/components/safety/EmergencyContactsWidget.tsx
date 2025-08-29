/**
 * EmergencyContactsWidget Component
 * Displays emergency contact list with quick access functionality
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { PhoneIcon, ChatIcon, CloseIcon, PlusIcon } from '../icons.dynamic';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: "hotline" | 'professional' | "personal" | "emergency";
  available: string;
  priority: number;
  lastContacted?: number;
}

interface EmergencyContactsWidgetProps {
  contacts?: EmergencyContact[];
  loading?: boolean;
  editable?: boolean;
  collapsible?: boolean;
  compact?: boolean;
  initialDisplay?: number;
  onContactUsed?: (data: { contactId: string; action: string; timestamp: number }) => void;
  onAddContact?: () => void;
  onRemoveContact?: (contactId: string) => void;
  onReorder?: (contactIds: string[]) => void;
}

export const EmergencyContactsWidget: React.FC<EmergencyContactsWidgetProps> = ({
  contacts = [],
  loading = false,
  editable = false,
  collapsible = false,
  compact = false,
  initialDisplay = 3,
  onContactUsed,
  onAddContact,
  onRemoveContact,
  onReorder
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [displayedContacts, setDisplayedContacts] = useState<EmergencyContact[]>([]);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Sort contacts by priority
  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  useEffect(() => {
    const shouldLimitDisplay = collapsible && !isExpanded;
    const limitedContacts = shouldLimitDisplay
      ? sortedContacts.slice(0, initialDisplay)
      : sortedContacts;
    setDisplayedContacts(limitedContacts);
  }, [contacts, isExpanded, collapsible, initialDisplay, sortedContacts]);

  const handleCall = (contact: EmergencyContact) => {
    try {
      if (!contact.phone || contact.phone === "invalid") {
        // Show error message
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Unable to initiate call";
        errorDiv.style.position = "fixed";
        errorDiv.style.top = "20px";
        errorDiv.style.left = "50%";
        errorDiv.style.transform = "translateX(-50%)";
        errorDiv.style.background = "#f44336";
        errorDiv.style.color = "white";
        errorDiv.style.padding = "10px";
        errorDiv.style.borderRadius = "4px";
        errorDiv.style.zIndex = "9999";
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
        return;
      }

      window.location.href = `tel:${contact.phone}`;
      onContactUsed?.({
        contactId: contact.id,
        action: 'call',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  const handleText = (contact: EmergencyContact) => {
    try {
      window.location.href = `sms:${contact.phone}`;
      onContactUsed?.({
        contactId: contact.id,
        action: "text",
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to initiate text:', error);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...sortedContacts];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onReorder?.(newOrder.map(c => c.id));
    }
  };

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (error) {
      console.error('Failed to copy phone number:', error);
    }
  };

  const formatLastContacted = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Less than 1 hour ago";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  if (loading) {
    return React.createElement('div', {
      className: 'emergency-contacts-widget',
      'data-testid': "emergency-contacts-widget"
    },
      React.createElement('div', { 'data-testid': "loading-skeleton" }, "Loading...")
    );
  }

  if (contacts.length === 0) {
    return React.createElement('div', {
      className: "emergency-contacts-widget",
      'data-testid': "emergency-contacts-widget"
    },
      React.createElement('h3', null, "Emergency Contacts"),
      React.createElement('div', { className: "empty-state" },
        React.createElement('p', null, "No emergency contacts added yet."),
        editable && React.createElement('button', {
          onClick: onAddContact,
          className: "add-first-contact-btn"
        }, "Add your first contact")
      )
    );
  }

  return React.createElement('section', {
    className: `emergency-contacts-widget ${compact ? "compact" : ""} ${window.innerWidth <= 768 ? "mobile-layout" : ""}`,
    'data-testid': "emergency-contacts-widget",
    'aria-label': "Emergency contacts",
    role: "region"
  },
    React.createElement('div', { className: "widget-header" },
      React.createElement('h3', null, "Emergency Contacts"),
      editable && React.createElement('button', {
        onClick: () => setIsEditMode(!isEditMode),
        className: "edit-btn"
      },
        React.createElement('span', null, "📝"),
        isEditMode ? "Done" : "Edit"
      )
    ),
    
    isEditMode && React.createElement('div', { className: "edit-header" },
      React.createElement('h4', null, "Edit Contacts"),
      onAddContact && React.createElement('button', {
        onClick: onAddContact,
        className: "add-contact-btn"
      },
        React.createElement(PlusIcon, { size: 16 }),
        "Add Contact"
      )
    ),
    
    React.createElement('div', { className: "contacts-list" },
      displayedContacts.map((contact, index) => 
        React.createElement('div', {
          key: contact.id,
          'data-testid': `contact-${index}`,
          className: `contact-item ${contact.priority === 1 ? "high-priority" : ""} ${window.innerWidth <= 768 ? 'touch-target' : ""}`
        },
          React.createElement('div', { className: 'contact-info' },
            React.createElement('div', { className: "contact-header" },
              React.createElement('span', {
                'data-testid': "contact-name",
                className: "contact-name"
              }, contact.name),
              React.createElement('span', {
                className: "contact-type",
                'data-testid': `icon-${contact.type}`
              }, contact.type)
            ),
            
            !compact && React.createElement('div', { className: 'contact-details' },
              contact.phone 
                ? React.createElement('a', {
                    href: `tel:${contact.phone}`,
                    className: 'contact-phone',
                    'aria-label': contact.phone
                  }, contact.phone)
                : React.createElement('span', { className: 'contact-phone' }, "No phone number"),
              React.createElement('span', {
                className: 'contact-availability',
                'aria-label': `Available ${contact.available}`
              }, contact.available),
              contact.lastContacted && React.createElement('span', { className: 'last-contacted' },
                "Last contacted: ", formatLastContacted(contact.lastContacted)
              )
            ),
            
            compact && React.createElement('span', { className: "contact-phone" },
              contact.phone || "No phone number"
            )
          ),
          
          React.createElement('div', { className: "contact-actions" },
            isEditMode 
              ? React.createElement(React.Fragment, null,
                  index > 0 && React.createElement('button', {
                    onClick: () => handleMoveUp(index),
                    className: "move-up-btn",
                    'aria-label': "Move up"
                  },
                    React.createElement('span', null, "⬆️")
                  ),
                  onRemoveContact && React.createElement('button', {
                    onClick: () => onRemoveContact(contact.id),
                    className: "remove-btn",
                    'aria-label': "Remove"
                  },
                    React.createElement(CloseIcon, { size: 16 }),
                    "Remove"
                  )
                )
              : React.createElement(React.Fragment, null,
                  React.createElement('button', {
                    onClick: () => handleCall(contact),
                    className: 'call-btn touch-target',
                    'aria-label': `Call ${contact.name}`
                  },
                    React.createElement(PhoneIcon, { size: 16 }),
                    "Call"
                  ),
                  contact.type === 'hotline' && React.createElement('button', {
                    onClick: () => handleText(contact),
                    className: "text-btn",
                    'aria-label': `Text ${contact.name}`
                  },
                    React.createElement(ChatIcon, { size: 16 }),
                    "Text"
                  ),
                  contact.phone && React.createElement('button', {
                    onClick: () => handleCopyPhone(contact.phone),
                    className: "copy-btn",
                    'aria-label': "Copy phone number"
                  },
                    copiedPhone === contact.phone 
                      ? React.createElement('span', null, "Copied!")
                      : React.createElement('span', null, "Copy")
                  )
                )
          )
        )
      )
    ),
    
    collapsible && contacts.length > initialDisplay && React.createElement('button', {
      onClick: () => setIsExpanded(!isExpanded),
      className: "expand-btn"
    },
      isExpanded 
        ? React.createElement(React.Fragment, null,
            React.createElement('span', null, "⬆️"),
            " Show less"
          )
        : React.createElement(React.Fragment, null,
            React.createElement('span', null, "⬇️"),
            " Show all (", contacts.length - initialDisplay, " more)"
          )
    )
  );
};

export default EmergencyContactsWidget;