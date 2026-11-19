import { z } from 'zod';

const companyNameMessage = 'Debes ingresar el nombre de la empresa';
const companyAddressMessage = 'Debes ingresar la dirección de la empresa';
const companySeniorityMessage =
  'Debes ingresar la antigüedad que tienes en la empresa';
const companyPositionMessage =
  'Debes ingresar el puesto que desempeñas en la empresa';
const companyBossFirstNameMessage =
  'Debes ingresar el nombre de tu jefe inmediato';
const companyBossLastNameMessage =
  'Debes ingresar el nombre de tu jefe inmediato';
const companyBossPhoneMessage =
  'Debes ingresar el teléfono celular de tu jefe inmediato';
const companyBossEmailMessage =
  'Debes ingresar el correo electrónico de tu jefe inmediato';
const companyWebpageMessage = 'Debes ingresar la página web de la empresa';

const firstNameMessage = 'Debes ingresar tus nombres';
const lastNameMessage = 'Debes ingresar tus apellidos';
const emailMessage = 'Debes ingresar tu correo';
const usernameMessage = 'Debes ingresar tu nombre de usuario';
const countryIdMessage = 'Debes ingresar una cédula previamente registrada';

export const createLeaseFormSchema = z.object({
  /*
   * === USER FIELDS ===
   */
  firstName: z.string({
    invalid_type_error: firstNameMessage,
    required_error: firstNameMessage,
  }),
  lastName: z.string({
    invalid_type_error: lastNameMessage,
    required_error: lastNameMessage,
  }),
  email: z.string({
    invalid_type_error: emailMessage,
    required_error: emailMessage,
  }),
  username: z.string({
    invalid_type_error: usernameMessage,
    required_error: usernameMessage,
  }),
  countryId: z.string({
    invalid_type_error: countryIdMessage,
    required_error: countryIdMessage,
  }),

  /*
   * === COMPANY FIELDS ===
   */
  worksInACompany: z.boolean(),
  companyName: z.string({
    invalid_type_error: companyNameMessage,
    required_error: companyNameMessage,
  }),
  companyAddress: z.string({
    invalid_type_error: companyAddressMessage,
    required_error: companyAddressMessage,
  }),
  companySeniority: z.string({
    invalid_type_error: companySeniorityMessage,
    required_error: companySeniorityMessage,
  }),
  companyPosition: z.string({
    invalid_type_error: companyPositionMessage,
    required_error: companyPositionMessage,
  }),
  companyWebpage: z
    .string({
      invalid_type_error: companyWebpageMessage,
      required_error: companyWebpageMessage,
    })
    .url('Debes ingresar una URL válida'),

  /*
   * === COMPANY BOSS FIELDS ===
   */
  companyBossFirstName: z.string({
    invalid_type_error: companyBossFirstNameMessage,
    required_error: companyBossFirstNameMessage,
  }),
  companyBossLastName: z.string({
    invalid_type_error: companyBossLastNameMessage,
    required_error: companyBossLastNameMessage,
  }),
  companyBossPhone: z.string({
    invalid_type_error: companyBossPhoneMessage,
    required_error: companyBossPhoneMessage,
  }),
  companyBossEmail: z.string({
    invalid_type_error: companyBossEmailMessage,
    required_error: companyBossEmailMessage,
  }),
});

export type CreateLeaseFormData = z.infer<typeof createLeaseFormSchema>;
