import PropTypes from 'prop-types'

export const componentPropInterface = PropTypes.oneOfType([PropTypes.element, PropTypes.func, PropTypes.node])
export const childrenPropInterface = PropTypes.oneOfType([
  PropTypes.arrayOf(componentPropInterface),
  componentPropInterface
])
