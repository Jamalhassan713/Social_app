enum roleEnum {
    User = 'user',
    ADMIN = 'admin'
}

enum genderEnum {
    MALE = 'male',
    FEMALE = 'female'
}
enum providerEnum {
    GOOGLE = 'google',
    LOCAL = 'local'
}
enum otpTypesEnum {
    CONFIRMATION = 'confirmation',
    RESET_PASSWORD = 'reset_password'
}
enum friendShipStatusEnum {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}
enum conversationEnum {
    DIRECT = 'direct',
    GROUP = 'group'
}

export { roleEnum, genderEnum, providerEnum, otpTypesEnum, friendShipStatusEnum, conversationEnum }